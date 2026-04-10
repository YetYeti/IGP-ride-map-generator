'use client'

import React from 'react'

interface UseCredentialAutofillSyncParams {
  usernameInputRef: React.RefObject<HTMLInputElement | null>
  passwordInputRef: React.RefObject<HTMLInputElement | null>
  onSync: (username: string, password: string) => void
}

export function useCredentialAutofillSync({
  usernameInputRef,
  passwordInputRef,
  onSync,
}: UseCredentialAutofillSyncParams) {
  React.useEffect(() => {
    const syncAutofilledCredentials = () => {
      const username = usernameInputRef.current?.value ?? ''
      const password = passwordInputRef.current?.value ?? ''

      onSync(username, password)
    }

    const timeoutId = window.setTimeout(syncAutofilledCredentials, 120)
    const animationFrameId = window.requestAnimationFrame(syncAutofilledCredentials)

    window.addEventListener('focus', syncAutofilledCredentials)
    window.addEventListener('pageshow', syncAutofilledCredentials)

    return () => {
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('focus', syncAutofilledCredentials)
      window.removeEventListener('pageshow', syncAutofilledCredentials)
    }
  }, [onSync, passwordInputRef, usernameInputRef])
}
