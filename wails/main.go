package main

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/out
var assets embed.FS

func main() {
	app := NewApp()

	// Create a sub-filesystem rooted at "frontend/out"
	frontendFS, err := fs.Sub(assets, "frontend/out")
	if err != nil {
		println("Error creating sub filesystem:", err.Error())
		return
	}

	// Custom handler for locale-based static export.
	// Rewrites locale-prefixed asset paths so relative ./ references in HTML work.
	locales := []string{"en", "zh", "ja", "es", "fr", "de"}

	fileServer := http.FileServer(http.FS(frontendFS))

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		// Rewrite locale-prefixed static asset paths:
		//   /en/_next/... → /_next/...
		// This is needed because Next.js static export places HTML at
		// /en/index.html but assets at /_next/..., while the HTML uses
		// relative paths like "./_next/..." which resolve to /en/_next/...
		for _, loc := range locales {
			prefix := "/" + loc + "/_next/"
			if len(path) >= len(prefix) && path[:len(prefix)] == prefix {
				r.URL.Path = "/_next/" + path[len(prefix):]
				break
			}
		}

		// For known locale paths without trailing slash, redirect to add one
		for _, loc := range locales {
			if path == "/"+loc {
				http.Redirect(w, r, "/"+loc+"/", http.StatusMovedPermanently)
				return
			}
		}

		fileServer.ServeHTTP(w, r)
	})

	err = wails.Run(&options.App{
		Title:     "P4RS3LT0NGV3",
		Width:     1200,
		Height:    800,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets:  frontendFS,
			Handler: handler,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 255},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
