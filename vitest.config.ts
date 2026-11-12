import { mergeConfig, defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig((env) =>
  mergeConfig(viteConfig(env), {
    test: {
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/properties/**/*.test.ts'],
      setupFiles: ['tests/setup.ts'],
      passWithNoTests: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/shared/ui/**', 'src/main.tsx', 'src/**/*.d.ts'],
        reporter: ['text-summary', 'html'],
      },
    },
  }),
);
