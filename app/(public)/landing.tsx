import { useRef, useEffect } from "react"; // Tambah useRef & useEffect
import { ScrollView, StyleSheet } from "react-native";
import { Hero } from "@/components/layout/Hero";
import { MenuPreview } from "../../components/layout/Preview";
import { WhyChooseUs } from "../../components/layout/WhyChooseUs";
import { About } from "../../components/layout/About";
import { Footer } from "@/components/layout/Footer";
import { theme } from "@/constants/theme";

// Objek helper untuk navigasi internal
export const scrollRegistry = {
  scrollToSection: (section: string) => {}
};

export default function Home() {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Daftarkan fungsi scroll ke registry agar bisa diakses Navbar
    scrollRegistry.scrollToSection = (section: string) => {
      let yOffset = 0;
      if (section === "home") yOffset = 0;
      if (section === "menu") yOffset = 600; // Sesuaikan angka ini dengan tinggi Hero
      if (section === "about") yOffset = 1800; // Sesuaikan angka ini dengan posisi About

      scrollRef.current?.scrollTo({ y: yOffset, animated: true });
    };
  }, []);

  return (
    <ScrollView 
      ref={scrollRef} // Pasang ref di sini
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Hero />
      <MenuPreview />
      <WhyChooseUs />
      <About />
      <Footer />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Menggunakan warna background dari theme kamu
    backgroundColor: theme.colors.background, 
  },
  contentContainer: {
    // Memberikan ruang di bagian paling bawah setelah Footer
    paddingBottom: 60, 
  },
});