APP_BINARY=App

build_app:
	@echo Building App binary...
	set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0 && go build -o ./cmd/bin ./cmd/api 
	@echo Done!