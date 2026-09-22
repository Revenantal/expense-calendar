import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'

// Testing Library does not auto-clean when globals are enabled this way.
// afterEach is a global here (test.globals: true in vitest.config.mts) -
// importing it from 'vitest' directly breaks suite detection in the setup file.
afterEach(() => {
  cleanup()
})
