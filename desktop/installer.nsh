!macro customInit
  ; Initialize register $0 to "0" (not detected)
  StrCpy $0 "0"

  ; 1. Check registry under HKCU (Current User) for previous installation
  ReadRegStr $1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.acom.gestion" "UninstallString"
  StrCmp $1 "" check_reg_hklm
  StrCpy $0 "1"
  Goto start_prompt

check_reg_hklm:
  ; 2. Check registry under HKLM (Local Machine)
  ReadRegStr $1 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.acom.gestion" "UninstallString"
  StrCmp $1 "" check_install_dir_exe
  StrCpy $0 "1"
  Goto start_prompt

check_install_dir_exe:
  ; 3. Check default installation directories for the application executable
  IfFileExists "$LOCALAPPDATA\Programs\acom-technologie-saas\Acom Gestion Desktop.exe" set_detected
  IfFileExists "$LOCALAPPDATA\Programs\Acom Gestion Desktop\Acom Gestion Desktop.exe" set_detected
  IfFileExists "$PROGRAMFILES\Acom Gestion Desktop\Acom Gestion Desktop.exe" set_detected
  IfFileExists "$PROGRAMFILES32\Acom Gestion Desktop\Acom Gestion Desktop.exe" set_detected
  IfFileExists "$PROGRAMFILES64\Acom Gestion Desktop\Acom Gestion Desktop.exe" set_detected

  ; 4. Check user data or physical database folders
  IfFileExists "$PROFILE\.acom_creative_studio\data.sqlite" set_detected
  IfFileExists "$PROFILE\.acom_creative_studio\desktop_settings.json" set_detected
  IfFileExists "$APPDATA\Acom Gestion Desktop\Local Storage" set_detected
  IfFileExists "$APPDATA\acom-technologie-saas\Local Storage" set_detected
  Goto done

set_detected:
  StrCpy $0 "1"

start_prompt:
  StrCmp $0 "1" show_prompt
  Goto done

show_prompt:
  MessageBox MB_YESNO|MB_DEFBUTTON1|MB_ICONQUESTION \
    "Une version existante de Acom Gestion Desktop a été détectée sur votre ordinateur.$\n$\n\
    Souhaitez-vous effectuer une MISE À JOUR (Recommandé) ou une NOUVELLE INSTALLATION ?$\n$\n\
    👉 Cliquez sur [ OUI ] pour Mettre à jour (Recommandé) :$\n\
    - Conserve votre session active, vos identifiants, vos paramètres et votre base de données locale.$\n\
    - Met à niveau uniquement les fichiers nécessaires sans réinitialisation.$\n\
    - Restaure automatiquement votre environnement au redémarrage.$\n$\n\
    👉 Cliquez sur [ NON ] pour une Nouvelle installation :$\n\
    - Installe une copie propre et neuve du logiciel.$\n\
    - Supprime et réinitialise les anciennes sessions et données locales." \
    IDYES keep_data IDNO clean_install

clean_install:
  DetailPrint "Réinitialisation complète des anciennes données utilisateur..."
  ; Clear potential sqlite and settings folders
  RMDir /r "$PROFILE\.acom_creative_studio"
  RMDir /r "$APPDATA\Acom Gestion Desktop"
  RMDir /r "$APPDATA\acom-technologie-saas"
  RMDir /r "$APPDATA\AcomGestion"
  RMDir /r "$APPDATA\Acom Gestion"
  RMDir /r "$APPDATA\AcomGestionDesktop"
  RMDir /r "$APPDATA\Acom_Gestion_Desktop"
  
  MessageBox MB_OK|MB_ICONINFORMATION "Les anciennes données et sessions locales ont été réinitialisées avec succès. Une installation propre va maintenant être effectuée."
  Goto done

keep_data:
  DetailPrint "Mode mise à jour activé : préservation absolue de l'environnement utilisateur."
  ; Create update marker file
  CreateDirectory "$PROFILE\.acom_creative_studio"
  FileOpen $2 "$PROFILE\.acom_creative_studio\.updated" w
  FileWrite $2 "1"
  FileClose $2
  Goto done

done:
!macroend

