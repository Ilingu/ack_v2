APP_BINARY_NAME=adkami-scrapping-api.exe

build_app:
	@echo Building App binary...
	set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0 && go build -o ./cmd/bin/${APP_BINARY_NAME} ./cmd/api 
	@echo Done!
build_docker:
	@echo Building Docker App...
	docker build -t ilingu/adkami-scrapping-api .
	@echo Done!
start: build_docker
	@echo Starting application...
	docker run -it --rm -p 3000:3000 ilingu/adkami-scrapping-api
	@echo Done!
push: build_docker
	@echo Pushing Application...
	docker push ilingu/adkami-scrapping-api
	@echo Done!
