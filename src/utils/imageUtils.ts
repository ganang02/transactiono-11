
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Request camera permissions
export async function requestCameraPermissions() {
  const permissions = await Camera.requestPermissions();
  return permissions.camera === 'granted';
}

// Take a photo using the device camera
export async function takePhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });
    
    if (photo && photo.webPath) {
      return photo.webPath;
    }
    
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
}

// Convert a photo URI to base64 for API upload
export async function convertPhotoToBase64(webPath: string): Promise<string | null> {
  try {
    // Fetch the photo as a blob
    const response = await fetch(webPath);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix to get just the base64 content
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting photo to base64:', error);
    return null;
  }
}

// Save a photo to file system
export async function savePhotoToFileSystem(webPath: string, fileName: string): Promise<string | null> {
  try {
    // Fetch the photo as a blob
    const response = await fetch(webPath);
    const blob = await response.blob();
    
    // Convert blob to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    // Save the file to the filesystem
    const savedFile = await Filesystem.writeFile({
      path: `product_images/${fileName}`,
      data: base64Data,
      directory: Directory.Data,
      recursive: true
    });
    
    return savedFile.uri;
  } catch (error) {
    console.error('Error saving photo to filesystem:', error);
    return null;
  }
}
