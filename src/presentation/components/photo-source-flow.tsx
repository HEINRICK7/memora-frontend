"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { PhotoGateway } from "../../application/photo-gateway";
import { savePhoto } from "../../application/save-photo";
import { validatePhotoFile } from "../../domain/photos/validate-photo";
import { photoApiGateway } from "../../infrastructure/photo-api-gateway";
import { BrandWordmark } from "./brand-wordmark";
import styles from "./photo-source-flow.module.css";

type Source = "gallery" | "google" | "camera";
type Stage = "sources" | "camera" | "selection";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type PhotoSourceFlowProps = {
  gateway?: PhotoGateway;
};

const sourceCards: ReadonlyArray<{
  id: Exclude<Source, "google">;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}> = [
  {
    id: "gallery",
    title: "minha galeria",
    description: "Use as fotos do seu celular",
    image: "/brand/v2/photos/gallery/campus-friends.webp",
    imageAlt: "",
  },
  {
    id: "camera",
    title: "tirar agora",
    description: "Capture novos momentos",
    image: "/brand/v2/photos/hero/festival-selfie.webp",
    imageAlt: "",
  },
];

let photoIdSequence = 0;

function validationMessage(file: File): string | null {
  const validation = validatePhotoFile(file);
  if (validation.valid) return null;
  if (validation.reason === "too-large") {
    return "Cada foto pode ter até 20 MiB.";
  }
  if (validation.reason === "empty") {
    return "Este arquivo está vazio. Escolha outra foto.";
  }
  return "Escolha arquivos JPEG ou PNG.";
}

export function PhotoSourceFlow({ gateway = photoApiGateway }: PhotoSourceFlowProps) {
  const router = useRouter();
  const [source, setSource] = useState<Source>("gallery");
  const [stage, setStage] = useState<Stage>("sources");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingPhotoId, setSavingPhotoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const previewUrlsRef = useRef(new Set<string>());

  function releasePreview(previewUrl: string) {
    if (!previewUrlsRef.current.has(previewUrl)) return;
    URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.delete(previewUrl);
  }

  function stopCamera() {
    cameraRequestRef.current += 1;
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    setIsCameraReady(false);
  }

  useEffect(() => {
    return () => {
      cameraRequestRef.current += 1;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      previewUrlsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrlsRef.current.clear();
    };
  }, []);

  function addFiles(files: FileList | File[] | null) {
    if (!files?.length) return;

    const accepted: PendingPhoto[] = [];
    const rejectedReasons = new Set<string>();
    for (const file of Array.from(files)) {
      const reason = validationMessage(file);
      if (reason) {
        rejectedReasons.add(reason);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      photoIdSequence += 1;
      accepted.push({ id: String(photoIdSequence), file, previewUrl });
    }

    if (accepted.length) {
      setPhotos((current) => [...current, ...accepted]);
      setStage("selection");
    }
    if (rejectedReasons.size) {
      setNotice(Array.from(rejectedReasons).join(" "));
    } else if (accepted.length) {
      setNotice(null);
    }
  }

  function handleFilesChanged(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.currentTarget.files);
    // Allow selecting the same image again after removing it.
    event.currentTarget.value = "";
  }

  async function startCamera() {
    setNotice(null);
    setStage("camera");
    setIsCameraReady(false);
    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;

    try {
      const getUserMedia = navigator.mediaDevices?.getUserMedia;
      if (!window.isSecureContext || !getUserMedia) throw new Error("camera-unavailable");
      const stream = await getUserMedia.call(navigator.mediaDevices, {
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      if (cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraReady(true);
    } catch {
      if (cameraRequestRef.current !== requestId) return;
      setStage("sources");
      setSource("gallery");
      setNotice("Não foi possível abrir a câmera. Você pode escolher fotos da galeria.");
    }
  }

  function cancelCamera() {
    stopCamera();
    setStage("sources");
    setSource("gallery");
    setNotice(null);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setNotice("A câmera ainda não está pronta. Tente novamente.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setNotice("Não foi possível capturar a foto. Escolha imagens da galeria.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();
    canvas.toBlob((blob) => {
      if (!blob) {
        setStage("sources");
        setSource("gallery");
        setNotice("Não foi possível capturar a foto. Escolha imagens da galeria.");
        return;
      }
      const file = new File([blob], `memora-camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      addFiles([file]);
    }, "image/jpeg");
  }

  function removePhoto(photoId: string) {
    const photo = photos.find((item) => item.id === photoId);
    if (photo) releasePreview(photo.previewUrl);
    setPhotos((current) => current.filter((item) => item.id !== photoId));
  }

  function clearPhotos() {
    photos.forEach((photo) => releasePreview(photo.previewUrl));
    setPhotos([]);
    setNotice(null);
  }

  async function saveSelectedPhotos() {
    if (!photos.length || isSaving) return;
    setIsSaving(true);
    setNotice(null);
    const failedPhotos: PendingPhoto[] = [];

    for (const photo of photos) {
      setSavingPhotoId(photo.id);
      try {
        await savePhoto(photo.file, gateway);
        releasePreview(photo.previewUrl);
      } catch {
        failedPhotos.push(photo);
      }
    }

    setSavingPhotoId(null);
    setIsSaving(false);
    if (failedPhotos.length) {
      setPhotos(failedPhotos);
      setNotice("Não foi possível guardar uma ou mais fotografias. Tente novamente.");
      return;
    }

    setPhotos([]);
    router.push("/templates");
  }

  function chooseSourceAndContinue() {
    if (source === "gallery") {
      fileInputRef.current?.click();
      return;
    }
    if (source === "camera") void startCamera();
  }

  function goBack() {
    if (stage === "camera") {
      cancelCamera();
      return;
    }
    setNotice(null);
    setStage("sources");
  }

  const selectedCountLabel = photos.length === 1
    ? "1 foto selecionada"
    : `${photos.length} fotos selecionadas`;

  return (
    <main className={styles.flow}>
      <header className={styles.header}>
        {stage === "sources" ? (
          <a className={styles.headerAction} href="/" aria-label="Voltar ao início">
            <span aria-hidden="true">‹</span>
          </a>
        ) : (
          <button className={styles.headerAction} type="button" onClick={goBack} aria-label="Voltar">
            <span aria-hidden="true">‹</span>
          </button>
        )}
        <a className={styles.brand} href="/" aria-label="Memora, início">
          <BrandWordmark />
        </a>
        <a className={styles.headerAction} href="/" aria-label="Cancelar criação">
          Cancelar
        </a>
      </header>

      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        aria-label="Escolher fotografias"
        onChange={handleFilesChanged}
      />

      {stage === "sources" && (
        <section className={styles.content} aria-labelledby="source-title">
          <p className={styles.eyebrow}>Novo mural</p>
          <h1 id="source-title" className={styles.title}>de onde vêm as fotos?</h1>

          <fieldset className={styles.sourceList}>
            <legend className={styles.visuallyHidden}>Origem das fotos</legend>
            <div role="radiogroup" aria-label="Origem das fotos" className={styles.radioGroup}>
              {sourceCards.map((card, index) => (
                <Fragment key={card.id}>
                  {index === 1 && (
                    <label className={`${styles.sourceCard} ${styles.sourceDisabled}`} key="google-photos">
                      <input
                        type="radio"
                        name="photo-source"
                        value="google"
                        disabled
                        aria-describedby="google-unavailable"
                      />
                      <span className={styles.googleMark} aria-hidden="true">✿</span>
                      <span className={styles.sourceCopy}>
                        <span className={styles.sourceTitle}>google fotos</span>
                        <span id="google-unavailable" className={styles.sourceDescription}>
                          indisponível nesta versão
                        </span>
                      </span>
                      <span className={styles.sourceArrow} aria-hidden="true">›</span>
                    </label>
                  )}
                  <label
                    className={`${styles.sourceCard} ${source === card.id ? styles.sourceSelected : ""}`}
                  >
                    <input
                      type="radio"
                      name="photo-source"
                      value={card.id}
                      checked={source === card.id}
                      onChange={() => setSource(card.id)}
                    />
                    <img className={styles.sourceImage} src={card.image} alt={card.imageAlt} aria-hidden="true" />
                    <span className={styles.sourceCopy}>
                      <span className={styles.sourceTitle}>{card.title}</span>
                      <span className={styles.sourceDescription}>{card.description}</span>
                    </span>
                    <span className={styles.sourceArrow} aria-hidden="true">›</span>
                  </label>
                </Fragment>
              ))}
            </div>
          </fieldset>

          {notice && <p className={styles.notice} role="alert">{notice}</p>}
          <button className={styles.primaryAction} type="button" onClick={chooseSourceAndContinue}>
            continuar <span aria-hidden="true">→</span>
          </button>
          <p className={styles.helper}>Você poderá selecionar as fotos na próxima etapa.</p>
        </section>
      )}

      {stage === "camera" && (
        <section className={styles.cameraContent} aria-labelledby="camera-title">
          <p className={styles.eyebrow}>Novo mural</p>
          <h1 id="camera-title" className={styles.cameraTitle}>registre esse momento</h1>
          <div className={styles.cameraViewport}>
            <video ref={videoRef} autoPlay playsInline muted aria-label="Prévia da câmera" />
            {!isCameraReady && <p role="status">Abrindo câmera…</p>}
          </div>
          {notice && <p className={styles.notice} role="alert">{notice}</p>}
          <div className={styles.cameraActions}>
            <button className={styles.secondaryAction} type="button" onClick={cancelCamera}>
              cancelar câmera
            </button>
            <button
              className={styles.primaryAction}
              type="button"
              onClick={capturePhoto}
              disabled={!isCameraReady}
            >
              capturar <span aria-hidden="true">●</span>
            </button>
          </div>
        </section>
      )}

      {stage === "selection" && (
        <section className={styles.content} aria-labelledby="selection-title">
          <p className={styles.eyebrow}>Selecione as fotos</p>
          <h1 id="selection-title" className={styles.title}>escolhe os melhores cliques</h1>
          <div className={styles.selectionBar}>
            <button
              className={styles.addAction}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
            >
              + adicionar fotos
            </button>
          </div>

          {photos.length ? (
            <ul className={styles.photoGrid} aria-label="Fotos selecionadas">
              {photos.map((photo) => (
                <li className={styles.photoTile} key={photo.id}>
                  <img src={photo.previewUrl} alt={photo.file.name} />
                  {savingPhotoId === photo.id && <span className={styles.savingTag}>guardando</span>}
                  <button
                    className={styles.removePhoto}
                    type="button"
                    aria-label={`Remover ${photo.file.name}`}
                    onClick={() => removePhoto(photo.id)}
                    disabled={isSaving}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptySelection}>
              <p>Nenhuma foto selecionada.</p>
              <p>Escolha imagens JPEG ou PNG para continuar.</p>
            </div>
          )}

          {notice && <p className={styles.notice} role="alert">{notice}</p>}

          <div className={styles.selectedTray}>
            <div className={styles.selectedTrayHeader}>
              <p aria-live="polite">{selectedCountLabel}</p>
              <button type="button" onClick={clearPhotos} disabled={!photos.length || isSaving}>
                limpar tudo
              </button>
            </div>
            {photos.length > 0 && (
              <ul className={styles.selectedStrip} aria-label="Prévia das fotos selecionadas">
                {photos.map((photo) => (
                  <li key={photo.id}>
                    <img src={photo.previewUrl} alt="" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.selectionActions}>
            <button
              className={styles.primaryAction}
              type="button"
              onClick={() => void saveSelectedPhotos()}
              disabled={!photos.length || isSaving}
            >
              {isSaving ? "guardando fotos…" : "usar essas fotos"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
