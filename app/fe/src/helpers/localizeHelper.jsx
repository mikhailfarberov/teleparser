import LocalizedStrings from 'react-localization';

import strings from '../variables/localization'

class LocalizeHelper {
  static locStrings

  static getLocString(stringKey){
    let lsLanguage = localStorage.getItem('language') !== null ? localStorage.getItem('language') : 'en'

    if (this.locStrings === undefined) {
      console.log(this.locStrings)
      this.locStrings = new LocalizedStrings(strings)
    }

    if (this.locStrings.getLanguage() !== lsLanguage) {
      this.locStrings.setLanguage(lsLanguage) 
    }        
    return this.locStrings[stringKey] !== undefined ? this.locStrings[stringKey] : stringKey
  }

  static getCurrentLanguage(){
    return this.locStrings.getLanguage()
  }

} 

export default LocalizeHelper