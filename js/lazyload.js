document.querySelectorAll(".video-placeholder").forEach(wrapper => {
  wrapper.addEventListener("click", () => {
    const src = wrapper.dataset.videoSrc;

    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.style.width = "100%";

    wrapper.replaceWith(video);
  });
});
