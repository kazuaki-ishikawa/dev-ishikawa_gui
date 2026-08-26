const KeystoneAdmin = require('./admin.js');

/**
 * 
 * SDP - user authentication (by SSS)
 * 
 *  version 5:
 *   ・ユーザ情報取得のつど、Adminトークンのキャッシュを利用するように修正
 *  version 4:
 *   ・ユーザToken取得がSSSAPIへ変更になった事に伴い、
 * 　　 skip_discover_userinfo = true の場合はユーザ情報取得のSkipを可能に
 *  version 3 :
 *   ・SSS v2 APIに対応
 *   ・SSS Menu 情報も取得
 *  version 2 :
 * 　・/session APIでecidを取得可能に
 * 
 * 
 * @param {*} bootProperties 
 * @param {*} logger 
 */
module.exports = function (bootProperties, logger) {

    const ksadmin = KeystoneAdmin(bootProperties);

    /**
     * 以下のSSSのAPI Callを実施しprofileに追加
     * 
     * /api/v2/users/{ecid}
     * /api/v2/users/{ecid}/menus
     * 
     * authentication.properties.skip_discover_userinfo = true で処理Skipも可能
     * 
     */
    return (context, [identifier], callback, next) => {

        // identifierからecidを抽出
        let ecid = identifier.substring(identifier.indexOf("/ecid") + 1)

        // ユーザプロファイル
        let profile = {
            provider: "sss.ntt.com",
            ecid: ecid,
            account_id: "unknown",
            email: "unknown",
            avatar: bootProperties.favicon,
        }

        /**
         * 
         * @param {*} isRetry 
         */
        const getUserInfomation = async (isRetry) => {
            if (isRetry == true)
                await ksadmin.clear(context);

            ksadmin.get(context)
                .then(async (CachedKeystoneAdminToken) => {
                    //
                    context.calloutHelper({
                        method: "GET",
                        headers: {
                            "X-Auth-Token": CachedKeystoneAdminToken
                        },
                        url: bootProperties.sss_endpoint + "/api/v2/users/" + ecid,

                    }, function (ex, proxyResponse = {}, authBody) {

                        console.log(">>>> sss(admin endpoint) - get user info : ", bootProperties.sss_endpoint + "/api/v2/users/" + ecid, proxyResponse.statusCode)

                        //
                        if (ex || proxyResponse.statusCode != 200) {
                            if (isRetry == true)
                                return callback(new Error("sss(admin endpoint) - get user info <Failed> [ecid:" + ecid + "][code:" + proxyResponse.statusCode + "]" + (ex ? "[error:" + ex.message || ex + "]" : "") + authBody))

                            console.warn(">>>> sss(admin endpoint) - get user info <Failed> , retry get user info...")
                            return getUserInfomation(true)
                        }

                        let body = JSON.parse(authBody)

                        // プロファイルを上書き
                        profile = {
                            ...profile,

                            account_id: body.login_id,
                            email: body.mail_address,

                            // 権限判定用フラグ
                            super_user: body.super_user,
                            contract_owner: body.contract_owner,
                            otp_activation: body.otp_activation,

                            // hiddenプロパティ（セッションには保存するが、apiレスポンスには返却しない）
                            _properties: body
                        }

                        console.log(">>>> SSS - get user info complete ", profile.account_id, " ", profile.email, body)

                        // メニュー権限取得
                        context.calloutHelper({
                            method: "GET",
                            headers: {
                                "X-Auth-Token": CachedKeystoneAdminToken
                            },
                            url: bootProperties.sss_endpoint + "/api/v2/users/" + ecid + "/menus",

                        }, function (ex, proxyResponse, authBody) {

                            console.log(">>>> sss(admin endpoint) - get user menus : ", bootProperties.sss_endpoint + "/api/v2/users/" + ecid, proxyResponse.statusCode)

                            //
                            if (ex || proxyResponse.statusCode != 200) {
                                if (isRetry == true)
                                    return callback(new Error("sss(admin endpoint) - get user menus <Failed> [ecid:" + ecid + "][code:" + proxyResponse.statusCode + "]" + (ex ? "[error:" + ex.message || ex + "]" : "") + authBody))
                                console.warn(">>>> sss(admin endpoint) - get user menus <Failed> , retry get user info...")
                                return getUserInfomation(true)
                            }

                            let body = JSON.parse(authBody)

                            // プロファイルを上書き
                            profile.menus = body.menus;

                            console.log(">>>> SSS - user authentication complete ", profile.account_id, " ", profile.email, body)

                            // 認可
                            callback(null, profile)
                        })
                    })
                })
        };

        // skipが明示的に指定されていない場合は、ユーザ情報取得を実施
        if (bootProperties.skip_discover_userinfo !== true)
            getUserInfomation(false);
        else {
            console.log(">>>> SSS - user authentication complete ", profile.ecid, " ")
            callback(null, profile)
        }
    }
}