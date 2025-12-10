clean:
	rm -rf .expo node_modules
	rm -rf android/.gradle android/.kotlin android/build android/local.properties
	rm -rf android/app/.cxx android/app/build
	rm -rf android/app/src/main/res
	rm -rf build/*.apk
	rm -rf bugreport-sdk*.zip

init:
	npm install


# Run locally for dev purpose
run: init
	npm start

emulate: init
	ANDROID_HOME="$$HOME/Android/Sdk" npx expo run:android --variant release


# Build locally
build: init
	npx expo prebuild -p android
	echo "sdk.dir=$$HOME/Android/Sdk" > android/local.properties
	cd android && ./gradlew assembleRelease && cd ..
	cp android/app/build/outputs/apk/release/app-release.apk build/budget-tracker.apk


# Run container for dev purpose
docker-dev-run:
	docker build -t budget-dev-tracker-app -f Dockerfile.dev .
	docker run -it \
		-p 8081:8081 \
		-v $$(pwd):/app \
		--network host \
		budget-dev-tracker-app:latest


# Build APK locally from docker container
docker-build: clean
	docker build -t budget-tracker-app -f Dockerfile.prod .
	docker run -it \
		-v $$(pwd)/build:/app/build \
		budget-tracker-app:latest \
		/bin/bash -c "./gradlew assembleRelease && \
		cp /app/android/app/build/outputs/apk/release/app-release.apk /app/build/budget-tracker.apk"
