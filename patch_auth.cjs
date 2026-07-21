const fs = require('fs');
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

const oldSignOut = `  const signOut = async () => {
    localStorage.removeItem('acom_offline_session');
    localStorage.removeItem('acom_offline_profile');
    localStorage.removeItem('acom_offline_hash');
    
    // Nettoyer également les paramètres physiques sur Desktop au logout
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveDesktopSettings) {
      try {
        await electronAPI.saveDesktopSettings({});
      } catch (err) {
        console.error('Failed to clear desktop settings file:', err);
      }
    }

    await firebaseSignOut(auth);
  };`;

const newSignOut = `  const signOut = async () => {
    localStorage.removeItem('acom_offline_session');
    localStorage.removeItem('acom_offline_profile');
    localStorage.removeItem('acom_offline_hash');
    localStorage.removeItem('acom_offline_email');
    localStorage.removeItem('acom_offline_password_b64');
    
    // Nettoyer également les paramètres physiques sur Desktop au logout
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveDesktopSettings && electronAPI?.getDesktopSettings) {
      try {
        const result = await electronAPI.getDesktopSettings();
        const settings = result?.settings || {};
        delete settings.savedEmail;
        delete settings.savedPassword;
        delete settings.acom_offline_session;
        delete settings.acom_offline_profile;
        delete settings.acom_offline_hash;
        delete settings.firebase_session;
        await electronAPI.saveDesktopSettings(settings);
      } catch (err) {
        console.error('Failed to clear desktop auth settings:', err);
      }
    } else if (electronAPI?.saveDesktopSettings) {
      await electronAPI.saveDesktopSettings({});
    }

    await firebaseSignOut(auth);
  };`;

code = code.replace(oldSignOut, newSignOut);
fs.writeFileSync('src/context/AuthContext.tsx', code);
