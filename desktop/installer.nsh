!macro customInit
  ; Check if any user data exists to detect a previous installation/run
  IfFileExists "$PROFILE\.acom_creative_studio\data.sqlite" show_prompt
  IfFileExists "$PROFILE\.acom_creative_studio\desktop_settings.json" show_prompt
  IfFileExists "$APPDATA\Acom Gestion Desktop\Local Storage" show_prompt
  Goto done

show_prompt:
  MessageBox MB_YESNO|MB_ICONQUESTION "Une version précédente de Acom Gestion Desktop a été détectée sur votre ordinateur.$\n$\nSouhaitez-vous effectuer une MISE À JOUR (Recommandé) ?$\n$\n- Cliquez sur [ OUI ] pour Mettre à jour : vos identifiants de connexion, votre session active, vos paramètres et l'intégralité de votre base de données locale SQLite seront préservés.$\n$\n- Cliquez sur [ NON ] pour effectuer une Nouvelle installation : les anciennes sessions et données locales seront réinitialisées à neuf." IDYES keep_data IDNO clean_install

clean_install:
  DetailPrint "Réinitialisation des anciennes données pour une nouvelle installation propre..."
  RMDir /r "$PROFILE\.acom_creative_studio"
  RMDir /r "$APPDATA\Acom Gestion Desktop"
  RMDir /r "$APPDATA\acom-technologie-saas"
  RMDir /r "$APPDATA\AcomGestion"
  RMDir /r "$APPDATA\Acom Gestion"
  RMDir /r "$APPDATA\AcomGestionDesktop"
  RMDir /r "$APPDATA\Acom_Gestion_Desktop"
  MessageBox MB_OK|MB_ICONINFORMATION "Les anciennes données et sessions locales ont été réinitialisées avec succès. L'installation propre va maintenant commencer."
  Goto done

keep_data:
  DetailPrint "Mode mise à jour : préservation de l'environnement utilisateur."
  Goto done

done:
!macroend
