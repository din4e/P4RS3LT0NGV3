package main

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	appDirName        = "P4RS3LT0NGV3"
	apiKeyFileName    = "apikey.enc"
	settingsFileName  = "settings.json"
	openRouterBaseURL = "https://openrouter.ai/api/v1/chat/completions"
	// Encryption key derived from a static machine-specific identifier.
	// This is not high-security vault-grade encryption; it keeps the key
	// from being stored in plaintext on disk. For stronger security,
	// integrate with the OS keychain (e.g. keyring library).
	encryptionKeyPhrase = "P4RS3LT0NGV3-0p3nR0ut3r-K3y-Pr0t3ct10n"
)

// App struct
type App struct {
	ctx        context.Context
	apiBaseURL string     // custom API base URL (empty = use default OpenRouter)
	cliBridge  *CLIBridge // CLI bridge for transforms
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Initialize CLI bridge
	cliBridge, err := NewCLIBridge()
	if err != nil {
		println("Warning: Failed to initialize CLI bridge:", err.Error())
	} else {
		a.cliBridge = cliBridge
	}
}

// ---------- Helpers ----------

// configDir returns the application config directory, creating it if needed.
func configDir() (string, error) {
	base, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("unable to determine user config directory: %w", err)
	}
	dir := filepath.Join(base, appDirName)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", fmt.Errorf("unable to create config directory: %w", err)
	}
	return dir, nil
}

// deriveKey creates a 32-byte AES key from the static phrase (padded or truncated).
func deriveKey() []byte {
	key := make([]byte, 32)
	copy(key, []byte(encryptionKeyPhrase))
	return key
}

// encrypt encrypts plaintext using AES-GCM.
func encrypt(plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(deriveKey())
	if err != nil {
		return nil, fmt.Errorf("creating cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("creating GCM: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("generating nonce: %w", err)
	}

	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

// decrypt decrypts ciphertext produced by encrypt.
func decrypt(ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(deriveKey())
	if err != nil {
		return nil, fmt.Errorf("creating cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("creating GCM: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}

// ---------- OpenRouter API Proxy ----------

// openRouterRequest mirrors the OpenRouter chat completion request body.
type openRouterRequest struct {
	Model       string                   `json:"model"`
	Messages    []map[string]interface{} `json:"messages"`
	Temperature float64                  `json:"temperature"`
	MaxTokens   int                      `json:"max_tokens"`
}

// CallOpenRouter sends a chat completion request to OpenRouter with the stored API key.
// The API key never leaves the backend.
func (a *App) CallOpenRouter(model string, messages []map[string]interface{}, temperature float64, maxTokens int) (string, error) {
	apiKey, err := a.loadAPIKey()
	if err != nil {
		return "", fmt.Errorf("API key not configured: %w", err)
	}
	if apiKey == "" {
		return "", fmt.Errorf("API key is not set; please configure it in settings")
	}

	reqBody := openRouterRequest{
		Model:       model,
		Messages:    messages,
		Temperature: temperature,
		MaxTokens:   maxTokens,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshalling request body: %w", err)
	}

	baseURL := a.apiBaseURL
	if baseURL == "" {
		baseURL = openRouterBaseURL
	}

	req, err := http.NewRequestWithContext(a.ctx, http.MethodPost, baseURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("HTTP-Referer", "https://github.com/p4rs3lt0ngv3")
	req.Header.Set("X-Title", "P4RS3LT0NGV3")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("sending request to OpenRouter: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenRouter API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return string(respBody), nil
}

// ---------- API Base URL ----------

// SetAPIBaseURL stores a custom API base URL. Pass empty string to reset to default.
func (a *App) SetAPIBaseURL(url string) {
	a.apiBaseURL = url
}

// GetAPIBaseURL returns the current custom API base URL, or empty if using default.
func (a *App) GetAPIBaseURL() string {
	return a.apiBaseURL
}

// ---------- API Key Management ----------

// loadAPIKey reads and decrypts the API key from disk.
func (a *App) loadAPIKey() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}

	path := filepath.Join(dir, apiKeyFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", fmt.Errorf("reading API key file: %w", err)
	}

	plaintext, err := decrypt(data)
	if err != nil {
		return "", fmt.Errorf("decrypting API key: %w", err)
	}

	return string(plaintext), nil
}

// SetAPIKey encrypts and stores the OpenRouter API key.
func (a *App) SetAPIKey(key string) error {
	dir, err := configDir()
	if err != nil {
		return err
	}

	if key == "" {
		// Remove the key file if an empty key is provided.
		path := filepath.Join(dir, apiKeyFileName)
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("removing API key file: %w", err)
		}
		return nil
	}

	encrypted, err := encrypt([]byte(key))
	if err != nil {
		return fmt.Errorf("encrypting API key: %w", err)
	}

	path := filepath.Join(dir, apiKeyFileName)
	if err := os.WriteFile(path, encrypted, 0600); err != nil {
		return fmt.Errorf("writing API key file: %w", err)
	}

	return nil
}

// GetAPIKeyStatus returns true if an API key is configured, false otherwise.
// It never exposes the key itself.
func (a *App) GetAPIKeyStatus() bool {
	dir, err := configDir()
	if err != nil {
		return false
	}

	path := filepath.Join(dir, apiKeyFileName)
	info, err := os.Stat(path)
	if err != nil {
		return false
	}

	return info.Size() > 0
}

// ---------- Settings Persistence ----------

// SaveSettings persists a JSON settings string to disk.
func (a *App) SaveSettings(settings string) error {
	dir, err := configDir()
	if err != nil {
		return err
	}

	// Validate that the input is valid JSON.
	if !json.Valid([]byte(settings)) {
		return fmt.Errorf("settings string is not valid JSON")
	}

	path := filepath.Join(dir, settingsFileName)
	if err := os.WriteFile(path, []byte(settings), 0600); err != nil {
		return fmt.Errorf("writing settings file: %w", err)
	}

	return nil
}

// LoadSettings reads and returns the JSON settings string from disk.
func (a *App) LoadSettings() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}

	path := filepath.Join(dir, settingsFileName)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			// Return empty JSON object when no settings file exists yet.
			return "{}", nil
		}
		return "", fmt.Errorf("reading settings file: %w", err)
	}

	return string(data), nil
}

// ---------- File Operations ----------

// SaveFileDialog opens a native save-file dialog and writes content to the chosen path.
func (a *App) SaveFileDialog(filename string, content string) error {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: filename,
		Title:           "Save File",
	})
	if err != nil {
		return fmt.Errorf("save file dialog: %w", err)
	}

	// User cancelled the dialog.
	if path == "" {
		return nil
	}

	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		return fmt.Errorf("writing file: %w", err)
	}

	return nil
}

// ---------- Clipboard ----------

// ReadClipboard reads the current text content from the OS clipboard.
func (a *App) ReadClipboard() (string, error) {
	text, err := runtime.ClipboardGetText(a.ctx)
	if err != nil {
		return "", fmt.Errorf("reading clipboard: %w", err)
	}
	return text, nil
}

// WriteClipboard writes text to the OS clipboard.
func (a *App) WriteClipboard(text string) error {
	if err := runtime.ClipboardSetText(a.ctx, text); err != nil {
		return fmt.Errorf("writing clipboard: %w", err)
	}
	return nil
}

// ---------- CLI Bridge Methods ----------

// CLITransformInfo represents transform info for frontend
type CLITransformInfo struct {
	Key         string                 `json:"key"`
	Name        string                 `json:"name"`
	Category    string                 `json:"category"`
	Priority    int                    `json:"priority"`
	CanDecode   bool                   `json:"canDecode"`
	Description string                 `json:"description"`
	InputKind   string                 `json:"inputKind"`
	Options     []CLITransformOption   `json:"options"`
}

// CLITransformOption represents a transform option for frontend
type CLITransformOption struct {
	ID      string      `json:"id"`
	Label   string      `json:"label"`
	Type    string      `json:"type"`
	Default interface{} `json:"default"`
	Min     *float64    `json:"min"`
	Max     *float64    `json:"max"`
	Step    *float64    `json:"step"`
	Options []struct {
		Label string `json:"label"`
		Value string `json:"value"`
	} `json:"options"`
}

// CLIListTransforms returns a list of all available transforms
func (a *App) CLIListTransforms() (string, error) {
	if a.cliBridge == nil {
		return "", fmt.Errorf("CLI bridge not initialized")
	}

	transforms, err := a.cliBridge.ListTransforms()
	if err != nil {
		return "", err
	}

	// Convert to JSON
	result := make([]CLITransformInfo, len(transforms))
	for i, t := range transforms {
		result[i] = CLITransformInfo{
			Key:         t.Key,
			Name:        t.Name,
			Category:    t.Category,
			Priority:    t.Priority,
			CanDecode:   t.CanDecode,
			Description: t.Description,
			InputKind:   t.InputKind,
			Options:     make([]CLITransformOption, len(t.Options)),
		}
		for j, opt := range t.Options {
			result[i].Options[j] = CLITransformOption{
				ID:      opt.ID,
				Label:   opt.Label,
				Type:    opt.Type,
				Default: opt.Default,
				Min:     opt.Min,
				Max:     opt.Max,
				Step:    opt.Step,
				Options: opt.Options,
			}
		}
	}

	bytes, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("marshalling transforms: %w", err)
	}
	return string(bytes), nil
}

// CLIInspectTransform returns detailed info about a specific transform
func (a *App) CLIInspectTransform(transformKey string) (string, error) {
	if a.cliBridge == nil {
		return "", fmt.Errorf("CLI bridge not initialized")
	}

	info, err := a.cliBridge.InspectTransform(transformKey)
	if err != nil {
		return "", err
	}

	result := CLITransformInfo{
		Key:         info.Key,
		Name:        info.Name,
		Category:    info.Category,
		Priority:    info.Priority,
		CanDecode:   info.CanDecode,
		Description: info.Description,
		InputKind:   info.InputKind,
		Options:     make([]CLITransformOption, len(info.Options)),
	}
	for j, opt := range info.Options {
		result.Options[j] = CLITransformOption{
			ID:      opt.ID,
			Label:   opt.Label,
			Type:    opt.Type,
			Default: opt.Default,
			Min:     opt.Min,
			Max:     opt.Max,
			Step:    opt.Step,
			Options: opt.Options,
		}
	}

	bytes, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("marshalling transform info: %w", err)
	}
	return string(bytes), nil
}

// CLIRunTransform executes a transform with the given parameters
func (a *App) CLIRunTransform(action, transformKey, text, optionsJSON string) (string, error) {
	if a.cliBridge == nil {
		return "", fmt.Errorf("CLI bridge not initialized")
	}

	var options map[string]interface{}
	if optionsJSON != "" {
		if err := json.Unmarshal([]byte(optionsJSON), &options); err != nil {
			return "", fmt.Errorf("parsing options JSON: %w", err)
		}
	}

	result, err := a.cliBridge.RunTransform(action, transformKey, text, options)
	if err != nil {
		return "", err
	}

	bytes, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("marshalling result: %w", err)
	}
	return string(bytes), nil
}

// CLIAutoDecode attempts to automatically decode text
func (a *App) CLIAutoDecode(text string) (string, error) {
	if a.cliBridge == nil {
		return "", fmt.Errorf("CLI bridge not initialized")
	}

	result, err := a.cliBridge.AutoDecode(text)
	if err != nil {
		return "", err
	}

	bytes, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("marshalling result: %w", err)
	}
	return string(bytes), nil
}

// CLICheckDependencies checks if CLI dependencies are available
func (a *App) CLICheckDependencies() string {
	if a.cliBridge == nil {
		// Try to create a temporary bridge to check dependencies
		cliBridge, err := NewCLIBridge()
		if err != nil {
			bytes, _ := json.Marshal(map[string]bool{"node": false, "python": false, "cli_bridge": false})
			return string(bytes)
		}
		cliBridge = cliBridge // prevent unused variable error
	}

	result := a.cliBridge.CheckCLIDependencies()
	bytes, _ := json.Marshal(result)
	return string(bytes)
}

// CLIEncode is a convenience method for encoding text
func (a *App) CLIEncode(transformKey, text, optionsJSON string) (string, error) {
	if a.cliBridge == nil {
		return "", fmt.Errorf("CLI bridge not initialized")
	}

	var options map[string]interface{}
	if optionsJSON != "" {
		if err := json.Unmarshal([]byte(optionsJSON), &options); err != nil {
			return "", fmt.Errorf("parsing options JSON: %w", err)
		}
	}

	return a.cliBridge.Encode(transformKey, text, options)
}

// CLIDecode is a convenience method for decoding text
func (a *App) CLIDecode(transformKey, text, optionsJSON string) (string, error) {
	if a.cliBridge == nil {
		return "", fmt.Errorf("CLI bridge not initialized")
	}

	var options map[string]interface{}
	if optionsJSON != "" {
		if err := json.Unmarshal([]byte(optionsJSON), &options); err != nil {
			return "", fmt.Errorf("parsing options JSON: %w", err)
		}
	}

	return a.cliBridge.Decode(transformKey, text, options)
}
