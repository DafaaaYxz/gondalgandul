/** @type {import('tailwindcss').Config} */
module.exports = {
  // Bagian ini PENTING: Memberitahu Tailwind file mana yang menggunakan class-classnya
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Menyesuaikan font agar otomatis menggunakan font style terminal
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
        sans: ['"Courier New"', 'Courier', 'monospace'], // Memaksa default font jadi terminal style
      },
      // Kamu bisa menambah warna custom di sini jika mau
      // Tapi kita sudah menggunakan palet bawaan (Slate, Cyan, Sky) yang lengkap
      colors: {
        // Contoh jika ingin warna hitam yang lebih pekat untuk background terminal
        'terminal-black': '#050505',
      },
      // Konfigurasi animasi tambahan (opsional)
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
