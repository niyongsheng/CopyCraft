; Localize the shortcut and Apps & Features name at install time.
; electron-builder passes SHORTCUT_NAME as a compile-time define; replace it
; with a runtime variable so the name follows the Windows UI language.

!ifndef BUILD_UNINSTALLER

!ifdef SHORTCUT_NAME
  !undef SHORTCUT_NAME
!endif

Var LocalizedShortcutName

!macro customInit
  StrCpy $LocalizedShortcutName "Copy Craft"
  System::Call 'kernel32::GetUserDefaultUILanguage() i .r0'
  ${If} $0 == 2052   ; zh-CN
  ${OrIf} $0 == 1028 ; zh-TW
  ${OrIf} $0 == 3076 ; zh-HK
  ${OrIf} $0 == 4100 ; zh-SG
  ${OrIf} $0 == 5124 ; zh-MO
    StrCpy $LocalizedShortcutName "字帖工坊"
  ${EndIf}
!macroend

!macro customInstall
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" DisplayName "$LocalizedShortcutName ${VERSION}"
!macroend

!define SHORTCUT_NAME "$LocalizedShortcutName"

!endif
