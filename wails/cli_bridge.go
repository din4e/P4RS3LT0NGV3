package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// CLIBridge provides methods to call the external CLI (Python/Node.js)
type CLIBridge struct {
	projectRoot string
}

// NewCLIBridge creates a new CLI bridge instance
func NewCLIBridge() (*CLIBridge, error) {
	// Find project root (where pyproject.toml or src/transformers exists)
	execPath, err := os.Executable()
	if err != nil {
		return nil, fmt.Errorf("getting executable path: %w", err)
	}

	// Walk up to find project root
	dir := filepath.Dir(execPath)
	for {
		if _, err := os.Stat(filepath.Join(dir, "src", "transformers")); err == nil {
			break
		}
		if _, err := os.Stat(filepath.Join(dir, "pyproject.toml")); err == nil {
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			// Reached root, use current working directory
			wd, _ := os.Getwd()
			dir = wd
			break
		}
		dir = parent
	}

	return &CLIBridge{projectRoot: dir}, nil
}

// TransformInfo represents metadata about a transform
type TransformInfo struct {
	Key         string                 `json:"key"`
	Name        string                 `json:"name"`
	Category    string                 `json:"category"`
	Priority    int                    `json:"priority"`
	CanDecode   bool                   `json:"canDecode"`
	Description string                 `json:"description,omitempty"`
	InputKind   string                 `json:"inputKind,omitempty"`
	Options     []TransformOption      `json:"configurableOptions,omitempty"`
}

// TransformOption represents a configurable option for a transform
type TransformOption struct {
	ID      string      `json:"id"`
	Label   string      `json:"label"`
	Type    string      `json:"type"`
	Default interface{} `json:"default,omitempty"`
	Min     *float64    `json:"min,omitempty"`
	Max     *float64    `json:"max,omitempty"`
	Step    *float64    `json:"step,omitempty"`
	Options []struct {
		Label string `json:"label"`
		Value string `json:"value"`
	} `json:"options,omitempty"`
}

// TransformResult represents the result of a transform operation
type TransformResult struct {
	OK            bool                   `json:"ok"`
	Action        string                 `json:"action,omitempty"`
	TransformKey  string                 `json:"transform,omitempty"`
	TransformName string                 `json:"name,omitempty"`
	Options       map[string]interface{} `json:"options,omitempty"`
	Output        string                 `json:"output,omitempty"`
	Error         string                 `json:"error,omitempty"`
}

// CLIBridgeResponse represents the response from CLI bridge
type CLIBridgeResponse struct {
	OK        bool                   `json:"ok"`
	Error     string                 `json:"error,omitempty"`
	Result    map[string]interface{} `json:"result,omitempty"`
	Transforms []TransformInfo       `json:"transforms,omitempty"`
	Transform *TransformInfo         `json:"transform,omitempty"`
}

// findPython finds the Python executable
func (b *CLIBridge) findPython() (string, error) {
	// Try uv first (faster)
	if _, err := exec.LookPath("uv"); err == nil {
		return "uv", nil
	}

	// Try python3
	if _, err := exec.LookPath("python3"); err == nil {
		return "python3", nil
	}

	// Try python (Windows)
	if _, err := exec.LookPath("python"); err == nil {
		return "python", nil
	}

	return "", fmt.Errorf("Python not found. Please install Python 3 or uv")
}

// findNode finds the Node.js executable
func (b *CLIBridge) findNode() (string, error) {
	if _, err := exec.LookPath("node"); err == nil {
		return "node", nil
	}
	return "", fmt.Errorf("Node.js not found. Please install Node.js")
}

// runCLIBridge runs the Node.js CLI bridge with the given payload
func (b *CLIBridge) runCLIBridge(payload map[string]interface{}) (*CLIBridgeResponse, error) {
	nodePath, err := b.findNode()
	if err != nil {
		return nil, err
	}

	bridgePath := filepath.Join(b.projectRoot, "scripts", "cli_bridge.js")
	if _, err := os.Stat(bridgePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("CLI bridge script not found at %s", bridgePath)
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshalling payload: %w", err)
	}

	cmd := exec.Command(nodePath, bridgePath)
	cmd.Stdin = strings.NewReader(string(payloadBytes))
	cmd.Dir = b.projectRoot

	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("CLI bridge failed: %s", string(exitErr.Stderr))
		}
		return nil, fmt.Errorf("running CLI bridge: %w", err)
	}

	// Parse the output (may have multiple lines, last line is JSON)
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(lines) == 0 {
		return nil, fmt.Errorf("CLI bridge returned no output")
	}

	var response CLIBridgeResponse
	if err := json.Unmarshal([]byte(lines[len(lines)-1]), &response); err != nil {
		return nil, fmt.Errorf("parsing CLI bridge response: %w", err)
	}

	return &response, nil
}

// ListTransforms returns a list of all available transforms
func (b *CLIBridge) ListTransforms() ([]TransformInfo, error) {
	response, err := b.runCLIBridge(map[string]interface{}{"command": "list"})
	if err != nil {
		return nil, err
	}

	if !response.OK {
		return nil, fmt.Errorf("list transforms failed: %s", response.Error)
	}

	return response.Transforms, nil
}

// InspectTransform returns detailed information about a specific transform
func (b *CLIBridge) InspectTransform(transformKey string) (*TransformInfo, error) {
	response, err := b.runCLIBridge(map[string]interface{}{
		"command":   "inspect",
		"transform": transformKey,
	})
	if err != nil {
		return nil, err
	}

	if !response.OK {
		return nil, fmt.Errorf("inspect transform failed: %s", response.Error)
	}

	return response.Transform, nil
}

// RunTransform executes a transform with the given parameters
func (b *CLIBridge) RunTransform(action, transformKey, text string, options map[string]interface{}) (*TransformResult, error) {
	payload := map[string]interface{}{
		"command":   "run",
		"action":    action,
		"transform": transformKey,
		"text":      text,
	}
	if options != nil {
		payload["options"] = options
	}

	response, err := b.runCLIBridge(payload)
	if err != nil {
		return nil, err
	}

	if !response.OK {
		return &TransformResult{OK: false, Error: response.Error}, nil
	}

	return &TransformResult{
		OK:            true,
		Action:        response.Result["action"].(string),
		TransformKey:  response.Result["transform"].(string),
		TransformName: response.Result["name"].(string),
		Options:       response.Result["options"].(map[string]interface{}),
		Output:        response.Result["output"].(string),
	}, nil
}

// AutoDecode attempts to automatically decode text
func (b *CLIBridge) AutoDecode(text string) (map[string]interface{}, error) {
	response, err := b.runCLIBridge(map[string]interface{}{
		"command": "auto-decode",
		"text":    text,
	})
	if err != nil {
		return nil, err
	}

	if !response.OK {
		return nil, fmt.Errorf("auto-decode failed: %s", response.Error)
	}

	return response.Result, nil
}

// Encode is a convenience method for encoding text
func (b *CLIBridge) Encode(transformKey, text string, options map[string]interface{}) (string, error) {
	result, err := b.RunTransform("encode", transformKey, text, options)
	if err != nil {
		return "", err
	}
	if !result.OK {
		return "", fmt.Errorf(result.Error)
	}
	return result.Output, nil
}

// Decode is a convenience method for decoding text
func (b *CLIBridge) Decode(transformKey, text string, options map[string]interface{}) (string, error) {
	result, err := b.RunTransform("decode", transformKey, text, options)
	if err != nil {
		return "", err
	}
	if !result.OK {
		return "", fmt.Errorf(result.Error)
	}
	return result.Output, nil
}

// runPythonCLI runs the Python CLI with the given arguments
func (b *CLIBridge) runPythonCLI(args ...string) (string, error) {
	pythonPath, err := b.findPython()
	if err != nil {
		return "", err
	}

	cliPath := filepath.Join(b.projectRoot, "p4rs3lt0ngv3_cli")
	if _, err := os.Stat(cliPath); os.IsNotExist(err) {
		return "", fmt.Errorf("Python CLI not found at %s", cliPath)
	}

	var cmd *exec.Cmd
	if pythonPath == "uv" {
		// Use uv run to execute the CLI
		cmd = exec.Command("uv", append([]string{"run", "p4rs3lt0ngv3-cli"}, args...)...)
	} else {
		// Use python -m to run the CLI module
		cmd = exec.Command(pythonPath, append([]string{"-m", "p4rs3lt0ngv3_cli"}, args...)...)
	}
	cmd.Dir = b.projectRoot

	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", fmt.Errorf("Python CLI failed: %s", string(exitErr.Stderr))
		}
		return "", fmt.Errorf("running Python CLI: %w", err)
	}

	return string(output), nil
}

// CheckCLIDependencies checks if CLI dependencies are available
func (b *CLIBridge) CheckCLIDependencies() map[string]bool {
	result := make(map[string]bool)

	// Check Node.js
	if _, err := b.findNode(); err == nil {
		result["node"] = true
	} else {
		result["node"] = false
	}

	// Check Python
	if _, err := b.findPython(); err == nil {
		result["python"] = true
	} else {
		result["python"] = false
	}

	// Check CLI bridge script
	bridgePath := filepath.Join(b.projectRoot, "scripts", "cli_bridge.js")
	if _, err := os.Stat(bridgePath); err == nil {
		result["cli_bridge"] = true
	} else {
		result["cli_bridge"] = false
	}

	return result
}

// getProjectRoot returns the project root directory
func (b *CLIBridge) getProjectRoot() string {
	return b.projectRoot
}

// detectProjectRoot attempts to find the project root from various starting points
func detectProjectRoot() string {
	// First, try current working directory
	wd, _ := os.Getwd()
	if isProjectRoot(wd) {
		return wd
	}

	// Walk up from working directory
	dir := wd
	for {
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		if isProjectRoot(parent) {
			return parent
		}
		dir = parent
	}

	// Try executable directory
	if execPath, err := os.Executable(); err == nil {
		dir := filepath.Dir(execPath)
		if isProjectRoot(dir) {
			return dir
		}
		// In wails, the executable might be in a build subdirectory
		for i := 0; i < 5; i++ {
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			if isProjectRoot(parent) {
				return parent
			}
			dir = parent
		}
	}

	// On macOS, check app bundle locations
	if runtime.GOOS == "darwin" {
		homeDir, _ := os.UserHomeDir()
		candidates := []string{
			filepath.Join(homeDir, "Projects", "P4RS3LT0NGV3"),
			filepath.Join(homeDir, "Developer", "P4RS3LT0NGV3"),
			filepath.Join("/Applications", "P4RS3LT0NGV3"),
		}
		for _, candidate := range candidates {
			if isProjectRoot(candidate) {
				return candidate
			}
		}
	}

	// On Windows, check common project locations
	if runtime.GOOS == "windows" {
		homeDir, _ := os.UserHomeDir()
		candidates := []string{
			filepath.Join(homeDir, "Projects", "P4RS3LT0NGV3"),
			filepath.Join(homeDir, "Developer", "P4RS3LT0NGV3"),
			filepath.Join(homeDir, "Documents", "P4RS3LT0NGV3"),
		}
		for _, candidate := range candidates {
			if isProjectRoot(candidate) {
				return candidate
			}
		}
	}

	// Fallback to working directory
	return wd
}

// isProjectRoot checks if a directory is the project root
func isProjectRoot(dir string) bool {
	// Check for key project files/directories
	indicators := []string{
		filepath.Join(dir, "src", "transformers"),
		filepath.Join(dir, "pyproject.toml"),
		filepath.Join(dir, "package.json"),
	}

	for _, indicator := range indicators {
		if _, err := os.Stat(indicator); err == nil {
			return true
		}
	}
	return false
}
