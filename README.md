# DJI Aerial Georeferencing with Computer Vision

This project takes a video from a DJI Mavic Air 2, combined with its flight log, Mapbox, and a computer vision model trained on Roboflow to find solar panels. It converts the machine learning model's predictions to GPS coordinates and uses them to visualize the recognized panels on a map.

https://user-images.githubusercontent.com/870796/189461690-122f4e64-a66e-40f0-ac4b-68258a8abe7e.mov

## Try It in Your Browser

The project is [deployed to Github Pages here](https://roboflow-ai.github.io/dji-aerial-georeferencing/) and you can test it out with [this sample video and flight log](https://drive.google.com/drive/folders/1m0lmYyLEQJiaykf821rYtyRvlO5Q_SAf).

If you have your own Drone video you'd like to use, [follow the instructions in the blog post to pull your detailed flight log from Airdata](https://blog.roboflow.com/georeferencing-drone-videos/).

## Resources

* Accompanying Blog Post: [Georeferencing Objects in Drone Videos](https://blog.roboflow.com/georeferencing-drone-videos/)
* Try the [aerial solar panels pre-trained computer vision model](https://universe.roboflow.com/brad-dwyer/aerial-solar-panels/model/5) in your browser on [Roboflow Universe](https://universe.roboflow.com)
* Browse other [Aerial Imagery Datasets and Pre-Trained Models](https://universe.roboflow.com/browse/aerial)
* [Train Your Own Computer Vision Model](https://docs.roboflow.com/quick-start) to use with this repo

## Run It Locally

* Clone this repo
* Run `npm install` in the main directory
* Run `npm run build:dev` to start a webpack build with livereload
* Open a new terminal window and run `npx serve dist`
* Open `http://localhost:3000` in your browser

## Customize It

This repo can easily be changed to run any custom model trained with [Roboflow](https://app.roboflow.com) including the thousands of [pre-trained models shared on Roboflow Universe](https://universe.roboflow.com/search?q=aerial%20imagery%20top%20down%20view%20trained%20model). Simply swap out your `publishable_key` and the `model` ID and `version` in the `ROBOFLOW_SETTINGS` at the top of [`main.js`](src/main.js).

There are also some additional configuration options available at the top of [`renderMap.js`](src/renderMap.js).

For example, changing the model to `swimming-pool-b6pz4` to use this [swimming pool computer vision model](https://universe.roboflow.com/hruthik-sivakumar/swimming-pool-b6pz4/model/2) from Roboflow Universe changes the functionality from plotting solar panels to plotting pools:

https://user-images.githubusercontent.com/870796/190296751-02b46989-7e18-4fcb-93c4-67e492cff401.mp4

## Contributing

Pull requests are welcome to improve this repo. Ideas for improvements that could be made:

* Taking into account changes in the ground elevation & their impact on the `distance` calculations
* Intelligently choosing the correct part of the flight log based on the duration of `isVideo` compared to the duration of the loaded video
* Exporting a JSON file of the detected objects
* Adding a CLI for processing outside of a web browser
* Rendering the flight video and predictions into a single image (patching video frames together)
* Video controls (play/pause, scrubbing)
* Option to show the video in a static position vs flying over the flight path
