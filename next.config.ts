/** @type {import('next').NextConfig} */
const nextConfig = {
  // Adiciona a instrução para exportar como site estático
  output: 'export',

  // Necessário para o componente <Image> funcionar no modo estático
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;