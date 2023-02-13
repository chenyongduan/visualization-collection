import React, { useEffect, useState, useRef } from "react";
import { Button, Select, message } from "antd";
import styles from "./index.module.scss";

enum VideoStatus {
  "noInit",
  "ready",
  "inRecording",
}

const photoSizeInfo = {
  1: { width: 295, height: 413 },
  2: { width: 413, height: 579 },
};

const TakeIDPhotos = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [photoSize, setPhotoSize] = useState<"1" | "2">("1");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [videoStatus, setVideoStatus] = useState<VideoStatus>(
    VideoStatus.noInit
  );

  const onStartOrEnd = () => {
    if (mediaRecorder.current) {
      if (videoStatus === VideoStatus.inRecording) {
        if (videoRef.current) {
          const canvas = document.createElement("canvas") as HTMLCanvasElement;
          const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
          const { width, height } = photoSizeInfo[photoSize];
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(videoRef.current, 0, 0, width, height);
          const imageUrl = canvas.toDataURL("image/jpeg");
          setFileName(`${new Date().getTime()}.jpeg`);
          setImageUrl(imageUrl);
        }
        mediaRecorder.current.stop();
        setVideoStatus(VideoStatus.ready);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      } else {
        if (imageUrl) {
          window.URL.revokeObjectURL(imageUrl);
          setFileName("");
          setImageUrl("");
        }
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
        mediaRecorder.current.start();
        setVideoStatus(VideoStatus.inRecording);
      }
    } else if (videoRef.current) {
      const constraints = {
        video: {
          width: photoSizeInfo[photoSize].width,
          height: photoSizeInfo[photoSize].height,
          facingMode: "user", // 强制使用前置摄像头
          frameRate: 60, // 每秒60帧
        },
      };
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia(constraints)
          .then((stream: MediaStream) => {
            if (videoRef.current && stream) {
              streamRef.current = stream;
            }
            const isSafari = !!(
              /Safari/.test(navigator.userAgent) &&
              !/Chrome/.test(navigator.userAgent)
            );
            const mimeType = isSafari ? "video/mp4" : "video/webm";
            try {
              const options = {
                videoBitsPerSecond: 5000000,
                mimeType,
              };
              const recorder = new MediaRecorder(stream, options);
              //   recorder.ondataavailable = (e) => {};
              //   recorder.onstop = (e) => {};
              mediaRecorder.current = recorder;
              if (videoRef.current && streamRef.current) {
                videoRef.current.srcObject = streamRef.current;
              }
              mediaRecorder.current.start();
              setVideoStatus(VideoStatus.inRecording);
            } catch (e) {
              message.error(`MediaRecorder创建失败:${e}. mimeType:${mimeType}`);
            }
          })
          .catch((e) => {
            message.error(
              "授权失败,请点击设置->隐私设置和安全->网站设置->摄像头，打开允许使用"
            );
          });
      } else {
        message.error("浏览器不支持getUserMedia");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (imageUrl) {
        window.URL.revokeObjectURL(imageUrl);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.title}>拍照</div>
      <div className={styles.content}>
        <div
          className={styles.videoBox}
          style={{
            width: `${photoSizeInfo[photoSize].width}px`,
            height: `${photoSizeInfo[photoSize].height}px`,
          }}
        >
          <video
            className={styles.recordVideo}
            style={{
              width: `${photoSizeInfo[photoSize].width}px`,
              height: `${photoSizeInfo[photoSize].height}px`,
            }}
            muted
            autoPlay
            x5-video-player-fullscreen="true"
            x5-playsinline="true"
            playsInline
            webkit-playsinline="true"
            crossOrigin="anonymous"
            ref={videoRef}
          ></video>
          {imageUrl && <img src={imageUrl} alt="" />}
        </div>
        <div className={styles.btns}>
          <Select
            value={photoSize}
            style={{ width: 80 }}
            onChange={(value: "1" | "2") => {
              setPhotoSize(value);
            }}
            options={[
              { value: "1", label: "1寸" },
              { value: "2", label: "2寸" },
            ]}
          />
          <Button type="primary" onClick={onStartOrEnd}>
            {videoStatus === VideoStatus.inRecording
              ? "点击拍照"
              : imageUrl
              ? "重新拍照"
              : "准备拍照"}
          </Button>
          {imageUrl && (
            <a download={fileName} href={imageUrl}>
              下载
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeIDPhotos;
