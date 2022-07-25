APP_BINARY=App

build_app:
	@echo Building App binary...
	set GOOS=linux&& set GOARCH=amd64&& set CGO_ENABLED=0 && go build -o ./cmd/bin ./cmd/api 
	@echo Done!
build_docker:
	@echo Building Docker App...
	docker build -t ilingu/9animelink-scrapping-api .
	@echo Done!
start: build_docker
	@echo Starting application...
	docker run -it --rm -p 3000:3000 ilingu/9animelink-scrapping-api
	@echo Done!
push: build_docker
	@echo Pushing Application...
	docker push ilingu/9animelink-scrapping-api
	@echo Done!
