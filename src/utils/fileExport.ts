
import { Filesystem, Directory } from '@capacitor/filesystem';
import { isPlatform } from '@ionic/vue';
import { toast } from "@/hooks/use-toast";

export async function saveFile(fileName: string, data: string, mimeType: string) {
  try {
    // Check if running on a mobile device
    const isMobile = window.matchMedia('(max-width: 768px)').matches 
      || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Use Capacitor Filesystem API for mobile
      const base64Data = btoa(data);
      
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      
      // For Android, we need to make it available for viewing
      await Filesystem.getUri({
        path: fileName,
        directory: Directory.Documents
      });
      
      toast({
        title: "Ekspor berhasil",
        description: `File telah disimpan ke Documents/${fileName}`,
      });
      
      return true;
    } else {
      // Use browser download for desktop
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    }
  } catch (error) {
    console.error("File save error:", error);
    toast({
      title: "Ekspor gagal",
      description: "Terjadi kesalahan saat mengekspor data",
      variant: "destructive"
    });
    return false;
  }
}
