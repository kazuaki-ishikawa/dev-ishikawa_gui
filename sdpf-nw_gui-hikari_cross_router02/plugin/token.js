/**
 * 
 * SDP - user token generator (by Keystone)
 * 
 * @param {*} bootProperties 
 * @param {*} logger 
 */
module.exports = function( bootProperties , logger ){

    //
    return ( context , callback )=>{

        //
        let keystoneBody = {
            auth :{
                //  Scoped認証
                scope : {
                    project : {
                        // テナントID
                        id : context.params["tenant_id"]
                    }
                },
                identity : {
                    methods : ["password"],
                    password :{
                        user : {
                            domain : {
                                id : "default"
                            },
                            name     : context.profile._properties.keystone_name,
                            password : context.profile._properties.keystone_password,
                        }
                    }
                }
            }
        };
        console.log(">>>> keystone(public endpoint) - get user token : " , JSON.stringify(keystoneBody, null , 4) )

        //
        context.calloutHelper({
            method : "POST",
            headers : {
                "Content-Type":"application/json"
            },
            url : bootProperties.keystone_public_endpoint + "/v3/auth/tokens",
            body : keystoneBody
        } , function(ex,proxyResponse={}, authBody){

            //
            if( ex || proxyResponse.statusCode != 201){
                return callback(new Error("keystone(public endpoint) - get user token <Failed> [user:"  + context.profile._properties.keystone_name + "][code:" + proxyResponse.statusCode + "]" + (ex ? "[error:" + ex.message || ex + "]" : "") + authBody  ) )
            }

            authBody = JSON.parse(authBody)

            let subjectToken = proxyResponse.headers["x-subject-token"];

            console.log(">>>> keystone(public endpoint) - get user token <Success>: " , bootProperties.keystone_public_endpoint + "/v3/auth/tokens", `[code:${proxyResponse.statusCode}][token:${subjectToken}]` )
            

            let profile = {
                token       : subjectToken ,
                
                expires     : authBody.token.expires_at ,

                properties  : authBody.token.project
            }
    
            console.log(">>>> Keystone - generate user token complete ", JSON.stringify(profile,null,4) )

            // 認可
            callback(null , profile)
        })
    }
}
