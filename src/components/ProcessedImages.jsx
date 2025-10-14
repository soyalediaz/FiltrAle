import { useState } from 'react'
import styles from './ProcessedImages.module.css'

const ProcessedImages = ({ processedImages, processingImages }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)

  const handleDownload = async (imageData, index) => {
    try {
      // Convertir blob URL a blob real
      const response = await fetch(imageData.processed)
      const blob = await response.blob()

      // Crear nombre del archivo
      const filename = `filtro-foto-${index + 1}.png`

      // Método moderno de descarga (Chrome, Edge, etc.)
      if ('download' in document.createElement('a')) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
      }
      // Método alternativo para móviles - abrir en nueva pestaña
      else if (/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Para móviles, abrir en nueva pestaña y sugerir guardar
        const url = URL.createObjectURL(blob)
        const newTab = window.open(url, '_blank')

        if (!newTab) {
          // Si los popups están bloqueados, mostrar instrucciones
          alert('Por favor, permita popups para descargar la imagen. Alternativamente, mantenga presionada la imagen y seleccione "Guardar imagen".')
        } else {
          // Mostrar instrucciones para guardar
          setTimeout(() => {
            alert('Imagen abierta en nueva pestaña. Use el menú del navegador para guardar la imagen.')
          }, 1000)
        }

        // Limpiar URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(url), 30000)
      }
      // Método alternativo para navegadores antiguos
      else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.target = '_blank'
        link.rel = 'noopener noreferrer'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error descargando imagen:', error)

      // Fallback: abrir en nueva pestaña
      try {
        const newTab = window.open(imageData.processed, '_blank')
        if (!newTab) {
          alert('Por favor, permita popups para descargar la imagen. Alternativamente, mantenga presionada la imagen y seleccione "Guardar imagen".')
        } else {
          alert('Imagen abierta en nueva pestaña. Use "Guardar imagen" del menú del navegador.')
        }
      } catch {
        alert('Error al descargar la imagen. Intente mantener presionada la imagen y seleccionar "Guardar imagen".')
      }
    }
  }

  const openModal = (imageData, index) => {
    setSelectedImage({ ...imageData, index })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedImage(null)
  }

  const handleModalDownload = () => {
    if (selectedImage) {
      handleDownload(selectedImage, selectedImage.index)
    }
  }

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true)

    try {
      // Descargar todas las imágenes una por una con delay
      for (let i = 0; i < processedImages.length; i++) {
        await handleDownload(processedImages[i], i)
        if (i < processedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      alert(`${processedImages.length} imagen(es) descargada(s) exitosamente!`)
    } catch (error) {
      console.error('Error descargando imágenes:', error)
      alert('Error al descargar las imágenes. Intente descargarlas individualmente.')
    } finally {
      setIsDownloadingAll(false)
    }
  }

  const isProcessing = (imageId) => {
    return processingImages && processingImages.has(imageId)
  }

  return (
    <div className={styles.processedImages}>
      <div className={styles.imagesHeader}>
        <h3>Imágenes Procesadas ({processedImages.length})</h3>
        <button
          className={`${styles.downloadAllBtn} ${isDownloadingAll ? styles.downloading : ''}`}
          onClick={handleDownloadAll}
          disabled={isDownloadingAll}
        >
          {isDownloadingAll ? 'Descargando...' : 'Descargar Todas'}
        </button>
      </div>
      
      <div className={styles.imagesGrid}>
        {processedImages.map((imageData, index) => {
          const processing = isProcessing(imageData.original.id)
          return (
            <div key={index} className={`${styles.imageItem} ${processing ? styles.processing : ''}`}>
              <div 
                className={styles.imageContainer}
                onClick={() => {
                  if (!processing) {
                    openModal(imageData, index)
                  }
                }}
                style={{ cursor: processing ? 'default' : 'pointer' }}
              >
                {processing ? (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Procesando...</p>
                  </div>
                ) : (
                  <img
                    src={imageData.processed}
                    alt={`Imagen procesada ${index + 1}`}
                    className={styles.processedImage}
                  />
                )}
              </div>
              <p className={styles.imageName}>{imageData.original.name}</p>
            </div>
          )
        })}
      </div>

      {/* Modal de vista previa */}
      {modalOpen && selectedImage && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeModal}>×</button>
            <div className={styles.modalImageContainer}>
              <img
                src={selectedImage.processed}
                alt={`Vista previa ${selectedImage.index + 1}`}
                className={styles.modalImage}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalDownloadBtn}
                onClick={handleModalDownload}
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProcessedImages 