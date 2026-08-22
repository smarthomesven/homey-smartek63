'use strict';

// SmartEK63 uses standard AWS Cognito USER_SRP_AUTH.
// amazon-cognito-identity-js implements the SRP-6a math for you.
const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} = require('amazon-cognito-identity-js');

const poolData = {
  UserPoolId: 'eu-central-1_mqMTP332P',
  ClientId: '751nsgtv5okg7u05mneacrn480',
};

const userPool = new CognitoUserPool(poolData);

/**
 * @param {string} username SmartEK63 account email
 * @param {string} password SmartEK63 account password
 * @returns {Promise<{accessToken:string, idToken:string, refreshToken:string, expiresIn:number}>}
 */
function login(username, password) {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          expiresIn: session.getAccessToken().getExpiration(),
        });
      },
      onFailure: (err) => {
        reject(err);
      },
      // Only needed if the pool has MFA enabled — SmartEK63's flow above
      // went straight from PASSWORD_VERIFIER to tokens, so likely unused.
      mfaRequired: () => {
        reject(new Error('MFA required — not yet handled'));
      },
    });
  });
}

/**
 * Refresh an existing session using the stored RefreshToken.
 */
function refresh(username, refreshToken) {
  return new Promise((resolve, reject) => {
    const { CognitoRefreshToken } = require('amazon-cognito-identity-js');

    const cognitoUser = new CognitoUser({
      Username: username,
      Pool: userPool,
    });

    cognitoUser.refreshSession(
      new CognitoRefreshToken({ RefreshToken: refreshToken }),
      (err, session) => {
        if (err) return reject(err);
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          expiresIn: session.getAccessToken().getExpiration(),
        });
      },
    );
  });
}

module.exports = { login, refresh };

// Quick manual test:
// node auth-example.js user@example.com 'password123'
if (require.main === module) {
  const [, , u, p] = process.argv;
  if (!u || !p) {
    console.error('Usage: node auth-example.js <email> <password>');
    process.exit(1);
  }
  login(u, p)
    .then((tokens) => console.log(JSON.stringify(tokens, null, 2)))
    .catch((err) => console.error('Auth failed:', err));
}