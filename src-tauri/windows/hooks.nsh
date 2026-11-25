; Extra steps for the Windows installer (Tauri runs these at the marked moments).
;
; Up to version 2.1.0 the program, its install folder, its shortcuts and its entry in Settings > Apps were
; called "Cloud-Freelife". From 2.2.0 they are all called "Project D.R.E.A.M". Updating from an older
; version therefore has to do some moving:
;
;   1. The new version is installed FIRST, next to the old one (in the same place on the disk, with the
;      new folder name). If anything goes wrong at this point the old version is untouched and still works.
;   2. Only then are the old shortcuts (Start menu, desktop, taskbar) pointed at the new program, the old
;      version is uninstalled and its leftovers are removed, and the saved-data folder gets its new name.
;
; Nothing here ever deletes the saved paintings, settings or downloads: the old uninstaller is told to
; leave them alone (/UPDATE) and the data folder is only ever renamed, never overwritten.

; The names the app had before 2.2.0 (they are only changed by the installer tests).
!ifndef DREAM_OLD_NAME
  !define DREAM_OLD_NAME "Cloud-Freelife"
!endif
!ifndef DREAM_OLD_MANU
  !define DREAM_OLD_MANU "cloudfreelife"
!endif
!ifndef DREAM_OLD_EXE
  !define DREAM_OLD_EXE "cloud-freelife.exe"
!endif
; Version 2.1.0 had already renamed the shortcuts (not the program) to this.
!ifndef DREAM_MID_NAME
  !define DREAM_MID_NAME "Project D.R.E.A.M"
!endif
!define DREAM_OLD_UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\${DREAM_OLD_NAME}"

; The folder inside AppData where the app keeps its paintings and settings. It used to be called
; "Cloud-Freelife"; every install and every update moves it to the new name (the app also does this
; itself the first time it starts, so whichever happens first is enough).
!ifndef DREAM_DATA_OLD
  !define DREAM_DATA_OLD "Cloud-Freelife"
!endif
!ifndef DREAM_DATA_NEW
  !define DREAM_DATA_NEW "Project D.R.E.A.M"
!endif

; Windows keeps the shortcuts pinned to the taskbar in this folder.
!ifndef DREAM_PINS
  !define DREAM_PINS "$APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar"
!endif

Var DreamOldDir ; where the old version is installed ("" when there is none)
Var DreamOldExe ; the old program file name

; Point one shortcut at the new program when it opens the old one. A shortcut with the old name gets the
; new name too (unless a shortcut with the new name is already there, then the old one is just dropped).
!macro DreamCarry dir name
  ${If} ${FileExists} "${dir}\${name}.lnk"
    !insertmacro IsShortcutTarget "${dir}\${name}.lnk" "$DreamOldDir\$DreamOldExe"
    Pop $0
    ${If} $0 = 1
      !insertmacro SetShortcutTarget "${dir}\${name}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
      ${If} "${name}" != "${PRODUCTNAME}"
        ${If} ${FileExists} "${dir}\${PRODUCTNAME}.lnk"
          Delete "${dir}\${name}.lnk"
        ${Else}
          Rename "${dir}\${name}.lnk" "${dir}\${PRODUCTNAME}.lnk"
        ${EndIf}
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend

; Move the saved-data folder to its new name. Nothing is ever overwritten: if the new folder already
; exists the old one is left exactly where it is.
!macro DreamMoveData
  ${If} ${FileExists} "$APPDATA\${DREAM_DATA_OLD}\*.*"
  ${AndIfNot} ${FileExists} "$APPDATA\${DREAM_DATA_NEW}"
    ClearErrors
    Rename "$APPDATA\${DREAM_DATA_OLD}" "$APPDATA\${DREAM_DATA_NEW}"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREINSTALL
  ; Is the old version installed? (Its entry in Settings > Apps says where.)
  StrCpy $DreamOldDir ""
  StrCpy $DreamOldExe "${DREAM_OLD_EXE}"
  ReadRegStr $0 HKCU "${DREAM_OLD_UNINST}" "UninstallString"
  ${If} $0 != ""
    ReadRegStr $DreamOldDir HKCU "Software\${DREAM_OLD_MANU}\${DREAM_OLD_NAME}" ""
    ${If} $DreamOldDir == ""
      ReadRegStr $1 HKCU "${DREAM_OLD_UNINST}" "InstallLocation"
      StrCpy $2 $1 1
      ${If} $2 == '"'
        StrLen $3 $1
        IntOp $3 $3 - 2
        StrCpy $DreamOldDir $1 $3 1
      ${Else}
        StrCpy $DreamOldDir $1
      ${EndIf}
    ${EndIf}
    ReadRegStr $1 HKCU "${DREAM_OLD_UNINST}" "MainBinaryName"
    ${If} $1 != ""
      StrCpy $DreamOldExe $1
    ${EndIf}
  ${EndIf}
  ${If} $DreamOldDir != ""
  ${AndIfNot} ${FileExists} "$DreamOldDir\*.*"
    StrCpy $DreamOldDir ""
  ${EndIf}

  ${If} $DreamOldDir != ""
    ; A quiet update (or a silent install) keeps the app where it already was: in the same folder as the
    ; old one, with the new folder name. When someone picks a folder by hand in the installer that choice
    ; is respected.
    ${If} ${Silent}
    ${OrIf} $PassiveMode = 1
    ${OrIf} $UpdateMode = 1
      ${If} $INSTDIR == "$LOCALAPPDATA\${PRODUCTNAME}"
        StrLen $3 $DreamOldDir
        StrCpy $4 $3
        ${Do}
          ${If} $4 = 0
            ${ExitDo}
          ${EndIf}
          IntOp $4 $4 - 1
          StrCpy $5 $DreamOldDir 1 $4
          ${If} $5 == "\"
            ${ExitDo}
          ${EndIf}
        ${Loop}
        IntOp $6 $4 + 1
        StrCpy $7 $DreamOldDir "" $6 ; the folder's own name
        ${If} $4 > 0
        ${AndIf} $7 == "${DREAM_OLD_NAME}"
          StrCpy $7 $DreamOldDir $4 ; the folder it sits in
          StrCpy $INSTDIR "$7\${PRODUCTNAME}"
        ${Else}
          StrCpy $INSTDIR $DreamOldDir
        ${EndIf}
        ; The installer has already made (and moved into) the default folder: drop it when it is empty
        ; and carry on in the right one.
        SetOutPath $INSTDIR
        RMDir "$LOCALAPPDATA\${PRODUCTNAME}"
      ${EndIf}
    ${EndIf}

    ; The old program must be closed before it can be replaced. (Does nothing when it is not running.)
    ${If} ${FileExists} "$DreamOldDir\$DreamOldExe"
      !insertmacro CheckIfAppIsRunning "$DreamOldDir\$DreamOldExe" "${PRODUCTNAME}"
    ${EndIf}
  ${EndIf}
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; the saved paintings and settings
  !insertmacro DreamMoveData

  ; The new version is in place. Now take over from the old one.
  ${If} $DreamOldDir != ""
    ; shortcuts: Start menu, desktop and the ones pinned to the taskbar
    !insertmacro DreamCarry "$SMPROGRAMS" "${DREAM_MID_NAME}"
    !insertmacro DreamCarry "$SMPROGRAMS" "${DREAM_OLD_NAME}"
    !insertmacro DreamCarry "$DESKTOP" "${DREAM_MID_NAME}"
    !insertmacro DreamCarry "$DESKTOP" "${DREAM_OLD_NAME}"
    FindFirst $8 $9 "${DREAM_PINS}\*.lnk"
    ${DoWhile} $9 != ""
      !insertmacro IsShortcutTarget "${DREAM_PINS}\$9" "$DreamOldDir\$DreamOldExe"
      Pop $0
      ${If} $0 = 1
        !insertmacro SetShortcutTarget "${DREAM_PINS}\$9" "$INSTDIR\${MAINBINARYNAME}.exe"
      ${EndIf}
      FindNext $8 $9
    ${Loop}
    FindClose $8

    ; the old version: its own uninstaller first (told to keep shortcuts and data), then whatever is left
    ${If} $DreamOldDir != $INSTDIR
      ${If} ${FileExists} "$DreamOldDir\uninstall.exe"
        ExecWait '"$DreamOldDir\uninstall.exe" /S /UPDATE _?=$DreamOldDir'
      ${EndIf}
      Delete "$DreamOldDir\uninstall.exe"
    ${EndIf}
    Delete "$DreamOldDir\$DreamOldExe"
    RMDir "$DreamOldDir"
    DeleteRegKey HKCU "${DREAM_OLD_UNINST}"
    DeleteRegKey HKCU "Software\${DREAM_OLD_MANU}\${DREAM_OLD_NAME}"
    DeleteRegKey /ifempty HKCU "Software\${DREAM_OLD_MANU}"
  ${EndIf}
!macroend
