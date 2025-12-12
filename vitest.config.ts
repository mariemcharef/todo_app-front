import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: ['default', 'html'],
    outputFile: {
      html: './vitest-report/index.html'
    }
  }
});
