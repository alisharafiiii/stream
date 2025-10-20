import Image from 'next/image'
import styles from './SplashScreen.module.css'

export default function SplashScreen() {
  return (
    <div className={styles.splashScreen}>
      <div className={styles.imageContainer}>
        <Image 
          src="/splash2.PNG" 
          alt="Click n Pray" 
          fill
          className={styles.fullscreenLogo}
          priority
          sizes="100vw"
          quality={100}
        />
      </div>
      <div className={styles.loaderOverlay}>
        <div className={styles.loader}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
      </div>
    </div>
  )
}
