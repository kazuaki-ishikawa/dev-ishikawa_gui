const KEYSTONE_ADMIN_TOKEN_KEY = "sss.keystone.admin.token";

/**
 * 
 * SDP - user authentication (by SSS)
 * 
 * @param {*} bootProperties 
 * @param {*} logger 
 */
module.exports = function(bootProperties, logger) {

    //
    return (context, [identifier], callback, next) => {

        // identifierからecidを抽出
        let ecid = identifier.substring(identifier.indexOf("/ecid") + 1)

        var retryCount = 0;

        let getKeystoneAdminToken = () => {
            retryCount++

            if (retryCount > 2)
                return callback(new Error("ecl auth request retry timeover:" + retryCount))

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
            let cachKey;
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


            context.calloutHelper({
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                url: bootProperties.keystone_admin_endpoint + "/v3/auth/tokens",
                body: keystoneBody
            }, function(ex, proxyResponse, authBody) {


                if (ex) {
                    console.error(">>>> keystone(admin endpoint) - get admin token <Failed> : ", bootProperties.keystone_admin_endpoint + "/v3/auth/tokens", JSON.stringify(keystoneBody, null, 4))
                    return callback(new Error("keystone(admin endpoint) - get admin token failed. [code:" + ex.message || ex + "]"))
                }
                if (proxyResponse.statusCode == 401) {
                    return getKeystoneAdminToken()
                }
                if (proxyResponse.statusCode != 201) {
                    console.error(">>>> keystone(admin endpoint) - get admin token <Failed> : ", bootProperties.keystone_admin_endpoint + "/v3/auth/tokens", JSON.stringify(keystoneBody, null, 4))
                    return callback(new Error("keystone(admin endpoint) - get admin token failed. [code:" + proxyResponse.statusCode + "]"))
                }

                console.log(">>>> keystone(admin endpoint) - get admin token <Success>: ", proxyResponse.statusCode, proxyResponse.headers["x-subject-token"])


                context.store.set(KEYSTONE_ADMIN_TOKEN_KEY, proxyResponse.headers["x-subject-token"], (ex) => {

                    if (ex) {
                        console.warn(ex.stack)
                        return getKeystoneAdminToken()
                    }

                    getUserInfomation();
                })

            })
        }

        let getUserInfomation = () => {

            context.store.get(KEYSTONE_ADMIN_TOKEN_KEY, (ex, CachedKeystoneAdminToken) => {

                if (CachedKeystoneAdminToken == null)
                    return getKeystoneAdminToken();

                //
                context.calloutHelper({
                    method: "GET",
                    headers: {
                        "X-Auth-Token": CachedKeystoneAdminToken
                    },
                    url: bootProperties.sss_endpoint + "/api/v1.0/users/" + ecid,

                }, function(ex, proxyResponse, authBody) {

                    console.log(">>>> sss(admin endpoint) - get user info : ", bootProperties.sss_endpoint + "/api/v1.0/users/" + ecid, proxyResponse.statusCode)
                        //
                    if (ex) {
                        console.error(ex.stack || ex)
                        return callback(new Error("sss(admin endpoint) - get user info failed. [ecid:" + ecid + "] [code:" + ex.message || ex + "]"))
                    }
                    if (proxyResponse.statusCode == 401) {
                        CachedAdminToken = null
                        retryCount = retryCount + 1
                        return getKeystoneAdminToken()
                    }
                    if (proxyResponse.statusCode != 200) {
                        return callback(new Error("sss(admin endpoint) - get user info failed. [ecid:" + ecid + "] [code:" + proxyResponse.statusCode + "]"))
                    }

                    let body = JSON.parse(authBody)

                    let profile = {
                        provider: "sss.ntt.com",

                        account_id: body.login_id,
                        email: body.mail_address,
                        avatar: bootProperties.favicon,

                        // hiddenプロパティ（セッションには保持るが、apiレスポンスには返却しない）
                        _properties: body
                    }

                    console.log(">>>> SSS - user authentication complete ", profile.account_id, " ", profile.email, body)

                    // 認可
                    callback(null, profile)

                })
            })
        }

        getUserInfomation()
    }
}