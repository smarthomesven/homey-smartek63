'use strict';

const Homey = require('homey');
const auth = require('../../lib/auth');
const axios = require('axios');

module.exports = class MyDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('MyDevice has been initialized');
    if (!this.hasCapability('onoff')) {
      // User needs to pair the device again
      await this.setUnavailable("Koppel het apparaat opnieuw");
      return;
    }
    // On/off
    this.registerCapabilityListener('onoff', async (value) => {
      if (value === true) {
        await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}/status`, {
          status: "on"
        }, {
          headers: {
            'Authorization': `${this.homey.settings.get("idToken")}`
          }
        });
      } else {
        await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}/status`, {
          status: "off"
        }, {
          headers: {
            'Authorization': `${this.homey.settings.get("idToken")}`
          }
        });
      }
    });
    // Target temperature (setpoint)
    this.registerCapabilityListener('target_temperature', async (value) => {
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}/temperature`, {
        temperature: value
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
    });
    // Relax mode
    this.registerCapabilityListener('relax_mode', async (value) => {
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}/relax`, {
        relaxMode: value
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
    });
    // Standby mode
    this.registerCapabilityListener('standby_mode', async (value) => {
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}/standby`, {
        standbyMode: value
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
    });
    // Fan speed
    this.registerCapabilityListener('fan_speed', async (value) => {
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}/fan`, {
        fan: 1,
        power: value*100
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
    });
    this.registerCapabilityListener('mode', async (value) => {
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}/mode`, {
        mode: value
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
    });
    this._interval = this.homey.setInterval(async () => {
      try {
        await this.pollStatus();
      } catch (error) {
        this.error(error);
      }
    }, 5 * 60 * 1000); // poll every 5 minutes
    try {
      await this.pollStatus();
    } catch (error) {
      this.error(error);
    }
  }

  async pollStatus() {
    try {
      const response = await axios.get(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${this.getData().id}`, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
      const resData = response.data;
      if (resData.online === false) {
        await this.setUnavailable(this.homey.__('errors.offline'));
        return;
      }
      await this.setAvailable();
      await this.setCapabilityValue('measure_temperature', resData.roomTemperature);
      await this.setCapabilityValue('target_temperature', resData.temperature);
      await this.setCapabilityValue('relax_mode', resData.relaxMode);
      await this.setCapabilityValue('standby_mode', resData.standbyMode);
      await this.setCapabilityValue('onoff', resData.status === 1);
      await this.setCapabilityValue('fan_speed', resData.fan1power);
    } catch (error) {
      if (error.response?.status === 401) {
        const authres = await auth.refresh(this.homey.settings.get('email'), this.homey.settings.get('refreshToken'));
        this.homey.settings.set('accessToken', authres.accessToken);
        this.homey.settings.set('idToken', authres.idToken);
        this.homey.settings.set('expiresIn', authres.expiresIn);
        await this.pollStatus();
        return;
      } else {
        this.error(error);
        await this.setUnavailable(this.homey.__('errors.server'));
        return;
      }
    }
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

};
