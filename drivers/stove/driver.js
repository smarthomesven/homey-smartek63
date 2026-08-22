'use strict';

const Homey = require('homey');
const auth = require('../../lib/auth');
const axios = require('axios');

module.exports = class MyDriver extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');
    const enableRelaxAction = this.homey.flow.getActionCard('enable_relax_mode');
    const disableRelaxAction = this.homey.flow.getActionCard('disable_relax_mode');
    const enableStandbyAction = this.homey.flow.getActionCard('enable_standby_mode');
    const disableStandbyAction = this.homey.flow.getActionCard('disable_standby_mode');
    enableRelaxAction.registerRunListener(async (args, state) => {
      const device = args.device;
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${device.getData().id}/relax`, {
        relaxMode: true
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
      await device.setCapabilityValue('relax_mode', true);
    });
    disableRelaxAction.registerRunListener(async (args, state) => {
      const device = args.device;
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${device.getData().id}/relax`, {
        relaxMode: false
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
      await device.setCapabilityValue('relax_mode', false);
    });
    enableStandbyAction.registerRunListener(async (args, state) => {
      const device = args.device;
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${device.getData().id}/standby`, {
        standbyMode: true
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
      await device.setCapabilityValue('standby_mode', true);
    });
    disableStandbyAction.registerRunListener(async (args, state) => {
      const device = args.device;
      await axios.put(`https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters/${device.getData().id}/standby`, {
        standbyMode: false
      }, {
        headers: {
          'Authorization': `${this.homey.settings.get("idToken")}`
        }
      });
      await device.setCapabilityValue('standby_mode', false);
    });
  }

  async onPair(session) {
    session.setHandler('showView', async (view) => {
      if (view === "login") {
        const idToken = this.homey.settings.get('idToken');
        if (idToken) {
          try {
            const response = await axios.get('https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters', {
              headers: {
                'Authorization': `${idToken}`
              }
            });
            await session.showView('list_devices');
            return;
          } catch (error) {
            if (error.response?.status === 401) {
              try {
                const authres = await auth.refresh(this.homey.settings.get('email'), this.homey.settings.get('refreshToken'));
                this.homey.settings.set('accessToken', authres.accessToken);
                this.homey.settings.set('idToken', authres.idToken);
                this.homey.settings.set('expiresIn', authres.expiresIn);
                await session.showView('list_devices');
                return;
              } catch (error) {
                this.error(error);
              }
            }
          }
        }
      }
    });
    session.setHandler('login', async (data) => {
      try {
        if (!data.email || !data.password) {
          return false;
        }
        const result = await auth.login(data.email, data.password);
        if (result.accessToken && result.refreshToken && result.idToken && result.expiresIn) {
          this.homey.settings.set('email', data.email);
          this.homey.settings.set('accessToken', result.accessToken);
          this.homey.settings.set('refreshToken', result.refreshToken);
          this.homey.settings.set('idToken', result.idToken);
          this.homey.settings.set('expiresIn', result.expiresIn);
        } else {
          return false;
        }
        // Test the connection
        let response;
        try {
          response = await axios.get('https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters', {
            headers: {
              'Authorization': `${this.homey.settings.get("idToken")}`
            }
          });
        } catch (error) {
          this.error("Error:", error.message);
          return false;
        }
        
        await session.showView('list_devices');
        return true;
      } catch (error) {
        this.error("Error:", error.message);
        return false;
      }
    });

    session.setHandler('list_devices', async (data) => {
      try {
        const response = await axios.get('https://8wmnu4exgg.execute-api.eu-central-1.amazonaws.com/prod/heaters', {
          headers: {
            'Authorization': `${this.homey.settings.get("idToken")}`
          }
        });
        return response.data.map(heater => {
          return {
            name: heater.name,
            data: {
              id: heater.id
            }
          }
        });
        // test data
        /*return [
          {
            name: "Pelletkachel 1",
            data: {
              id: "112233445566"
            }
          },
          {
            name: "Pelletkachel 2",
            data: {
              id: "123456123456"
            }
          },
          {
            name: "Pelletkachel 3",
            data: {
              id: "112233445567"
            }
          }
        ];*/
      } catch (error) {
        this.error("Error:", error.message);
        return false;
      }
    });
  }

  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      // Example device data, note that `store` is optional
      // {
      //   name: 'My Device',
      //   data: {
      //     id: 'my-device',
      //   },
      //   store: {
      //     address: '127.0.0.1',
      //   },
      // },
    ];
  }

};
