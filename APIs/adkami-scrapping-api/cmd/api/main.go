package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type AppConfig struct {
}

func main() {
	rand.Seed(time.Now().UnixNano())

	// Loading env variables
	if os.Getenv("APP_MODE") != "prod" {
		err := godotenv.Load("../../.env")
		if err != nil {
			log.Fatal("Error loading .env file")
		}
	}

	app := AppConfig{} // app
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", os.Getenv("PORT")),
		Handler: app.routes(), // server
	}

	time.AfterFunc(time.Second, func() {
		log.Printf("Server successfully started on port %s", os.Getenv("PORT"))
		RegisterCron()
	}) // is server started timeout

	log.Print(srv.ListenAndServe()) // start server
	log.Fatal("Server Crashed/Failed to start ❌")
}
