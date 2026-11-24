; Extra steps for the Windows installer (Tauri runs these at the marked moments).
;
; The program, its install folder and its installer keep the original "Cloud-Freelife" names, so
; updating in place and your saved paintings are never affected. These steps only change the name
; Windows SHOWS: the Start menu and desktop shortcuts and the entry in Settings > Apps.
;
; They also run during a quiet update (which does not make new shortcuts), so an existing install
; gets the new name the next time it updates.

!ifndef DREAM_NAME
  !define DREAM_NAME "Project D.R.E.A.M"
!endif

; Rename a shortcut from the old name to the new one, but only when it really opens this program.
!macro DreamUseNewName dir
  ${If} ${FileExists} "${dir}\${PRODUCTNAME}.lnk"
    !insertmacro IsShortcutTarget "${dir}\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
    Pop $0
    ${If} $0 = 1
      Delete "${dir}\${DREAM_NAME}.lnk"
      Rename "${dir}\${PRODUCTNAME}.lnk" "${dir}\${DREAM_NAME}.lnk"
    ${EndIf}
  ${EndIf}
!macroend

; Put the old name back so the normal uninstall steps find and remove the shortcut.
!macro DreamUseOldName dir
  ${If} ${FileExists} "${dir}\${DREAM_NAME}.lnk"
    !insertmacro IsShortcutTarget "${dir}\${DREAM_NAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
    Pop $0
    ${If} $0 = 1
      Delete "${dir}\${PRODUCTNAME}.lnk"
      Rename "${dir}\${DREAM_NAME}.lnk" "${dir}\${PRODUCTNAME}.lnk"
    ${EndIf}
  ${EndIf}
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; the name in Settings > Apps > Installed apps
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayName" "${DREAM_NAME}"
  ; the Start menu and desktop shortcuts
  !insertmacro DreamUseNewName "$SMPROGRAMS"
  !insertmacro DreamUseNewName "$DESKTOP"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; during an update the shortcuts stay as they are; only a real uninstall removes them
  ${If} $UpdateMode <> 1
    !insertmacro DreamUseOldName "$SMPROGRAMS"
    !insertmacro DreamUseOldName "$DESKTOP"
  ${EndIf}
!macroend
