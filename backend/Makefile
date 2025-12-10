clean:
	rm -rf database/*db

init:
	./init.sh

seed:
	python seed_dummy_data.py


# Run locally for dev purpose
run: init
	DEV_MODE_ENABLED="1" ./run.sh


# Run container for dev purpose
docker-build:
	docker build . -t budget-tracker-api

docker-dev-run: docker-build
	docker run -it \
		-e DEV_MODE_ENABLED=1 \
		-p 8000:8000 \
		-v $$(pwd):/app \
		budget-tracker-api:latest


# Run prod container
docker-run: clean docker-build
	docker run -it -p 8000:8000 budget-tracker-api:latest
