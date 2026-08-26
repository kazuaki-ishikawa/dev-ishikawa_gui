const KEYSTONE_ADMIN_TOKEN_KEY = "sss.keystone.admin.token";

/**
 * 
 * SDP - admin token  (by Keystone)
 * 
 * 20220909 トークン再取得時の不具合修正
 * 
 * @param {*} bootProperties 
 */
module.exports = function (bootProperties) {

    return {

        /**
         * 
         * @param {*} context 
         * @returns 
         */
        async get(context) {
            return new Promise((resolve, reject) => {
                context.store.get(KEYSTONE_ADMIN_TOKEN_KEY, (ex, CachedKeystoneAdminToken) => {
                    if (ex || CachedKeystoneAdminToken == null)
                        return this.generate(context)
                            .then(resolve)
                            .catch(reject)
                    //
                    resolve(CachedKeystoneAdminToken)
                })
            })
        },

        /**
         * 
         * @param {*} context 
         * @returns 
         */
        async clear(context) {
            return new Promise((resolve, reject) => {
                context.store.set(KEYSTONE_ADMIN_TOKEN_KEY, null, (ex) => {
                    if (ex) {
                        console.warn(ex.stack)
                        return resolve()
                    }
                    resolve();
                })
            })
        },


        /**
         * 
         * @param {*} context 
         * @returns 
         */
        async generate(context) {
            return new Promise((resolve, reject) => {

                //
                const getKeystoneAdminToken = (isRetry) => {

                    let keystoneBody = {
                        auth: {
                            identity: {
                                methods: ["password"],
                                password: {
                                    user: {
                                        domain: {
                                            id: "default"
                                        },
                                        password: bootProperties.keystone_password,
                                    }
                                }
                            }
                        }
                    };

                    // USER ID/NAME
                    if (bootProperties.keystone_userid) {
                        keystoneBody.auth.identity.password.user.id = bootProperties.keystone_userid;
                    } else if (bootProperties.keystone_username) {
                        keystoneBody.auth.identity.password.user.name = bootProperties.keystone_username;
                    }

                    // scoped 認証にも対応
                    if (bootProperties.keystone_projectid) {
                        keystoneBody.auth.scope = {
                            project: {
                                // テナントIDに相当
                                id: bootProperties.keystone_projectid,
                            }
                        }
                    }

                    console.error(">>>> keystone(admin endpoint) - get admin token <Start> : ", bootProperties.keystone_admin_endpoint + "/v3/auth/tokens")

                    //
                    context.calloutHelper({
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        url: bootProperties.keystone_admin_endpoint + "/v3/auth/tokens",
                        body: keystoneBody
                    }, function (ex, proxyResponse, authBody) {

                        if (ex) {
                            console.error(">>>> keystone(admin endpoint) - get admin token <Failed> : ", bootProperties.keystone_admin_endpoint + "/v3/auth/tokens", JSON.stringify(keystoneBody, null, 4))
                            if (isRetry == true)
                                return reject(new Error("keystone(admin endpoint) - get admin token failed. [code:" + ex.message || ex + "]"))

                            console.warn(">>>> so , retry get admin token...")
                            return getKeystoneAdminToken(true);
                        }

                        if (proxyResponse.statusCode != 201) {
                            console.error(">>>> keystone(admin endpoint) - get admin token <Failed> : ", bootProperties.keystone_admin_endpoint + "/v3/auth/tokens", JSON.stringify(keystoneBody, null, 4))
                            return reject(new Error("keystone(admin endpoint) - get admin token failed. [code:" + proxyResponse.statusCode + "]"))
                        }

                        console.log(">>>> keystone(admin endpoint) - get admin token <Success>: ", proxyResponse.statusCode, proxyResponse.headers["x-subject-token"])

                        let accessToken = proxyResponse.headers["x-subject-token"];

                        context.store.set(KEYSTONE_ADMIN_TOKEN_KEY, accessToken, (ex) => {
                            if (ex) {
                                return reject(ex)
                            }
                            resolve(accessToken);
                        })
                    })
                }
                //
                getKeystoneAdminToken(false);
            })
        }
    }
}