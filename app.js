'use strict';

const Homey = require('homey');

module.exports = class SmartEK63App extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('SmartEK63 app has been initialized');
  }

};
