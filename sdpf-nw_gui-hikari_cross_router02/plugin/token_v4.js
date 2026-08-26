const KeystoneAdmin = require('./admin.js');

/**
 * 
 * SDP - user token generator (by SSS)
 * 
 * [TODO] tenant_idの取得バリエーション対応
 * 
 *  version 4:
 *   ・ユーザToken取得時の admin token 失効再取得に対応
 *  version 3 :
 *   ・ユーザToken取得をKeystone Public から SSS APIへ変更
 *  version 2 :
 *   ・API-Proxyでのトークンインジェクション設定を追加
 * 
 * @param {*} bootProperties 
 * @param {*} logger 
 */
module.exports = function (bootProperties, logger) {

    const ksadmin = KeystoneAdmin(bootProperties);

    //
    return {

        // トークンインジェクター
        inject: (req) => {
            if (req && req.user)
                req.headers["x-auth-token"] = req.user.accessToken;
        },

        // トークンジェネレーター
        generate: (context, callback) => {

            // [TODO]SDPによって、tenant_id の流通方法は異なることに注意
            let tenant_id = context.params["tenant_id"] || context._req.query["tenant_id"];

            // profile情報からecidを取得
            let ecid = context.profile.ecid;

            // endpoint
            let url = `${bootProperties.sss_endpoint}/api/v2/tokens/users/${ecid}?nocatalog=true`;

            console.log(`>>>> sss(admin endpoint) - get user token start [ecid:${ecid}] [url:${url}][scope:${tenant_id}]`)

            /**
             * 
             * @param {*} isRetry 
             */
            const getUserToken = async (isRetry) => {
                if (isRetry == true)
                    await ksadmin.clear(context);

                ksadmin.get(context)
                    .then(CachedKeystoneAdminToken => {

                        context.calloutHelper({
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Auth-Token": CachedKeystoneAdminToken
                            },
                            url: url,
                            body: {
                                tenant_id: tenant_id
                            }
                        }, (ex, proxyResponse = {}, authBody) => {

                            //
                            if (ex || proxyResponse.statusCode != 201) {
                                if (isRetry == true)
                                    return callback(new Error("sss(admin endpoint) - get user token <Failed> [ecid:" + ecid + "][code:" + proxyResponse.statusCode + "]" + (ex ? "[error:" + ex.message || ex + "]" : "") + authBody))

                                console.warn(">>>> sss(admin endpoint) - get user token <Failed> , retry get user token...")
                                return getUserToken(true)
                            }

                            authBody = JSON.parse(authBody)

                            let subjectToken = proxyResponse.headers["x-subject-token"];

                            console.log(">>>> sss(admin endpoint) - get user token <Success>: ", url, `[code:${proxyResponse.statusCode}][token:${subjectToken}]`)

                            let result = {
                                token: subjectToken,
                                expires: authBody.token.expires_at,
                                properties: authBody.token.project
                            }

                            console.log(">>>> sss - generate user token complete ", JSON.stringify(result, null, 4))

                            // 完了
                            callback(null, result)
                        })
                    })
                    .catch(ex => {
                        return callback(new Error("get admin token failed." + ex.message))
                    })
            }

            getUserToken(false);
        }
    }
}
