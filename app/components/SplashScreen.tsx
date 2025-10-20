import Image from 'next/image'
import styles from './SplashScreen.module.css'

export default function SplashScreen() {
  return (
    <div className={styles.splashScreen}>
      <Image 
        src="/clicknpray-preview.png" 
        alt="Click n Pray" 
        fill
        className={styles.fullscreenLogo}
        priority
        style={{ objectFit: 'contain' }}
      />
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
