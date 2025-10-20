import Image from 'next/image'
import styles from './SplashScreen.module.css'

export default function SplashScreen() {
  return (
    <div className={styles.splashScreen}>
      <Image 
        src="/clicknpray-preview.png" 
        alt="Click n Pray" 
        width={200} 
        height={200}
        className={styles.logo}
        priority
      />
      <h1 className={styles.title}>Click n Pray</h1>
      <p className={styles.tagline}>Double or Nothing</p>
      <div className={styles.loader}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
    </div>
  )
}
