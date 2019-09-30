const sgMail= require('@sendgrid/mail')


const sengridAPIkey= "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"

sgMail.setApiKey(process.env.SENGRID_API_KEY)

const sendWelcomeMail = (email, name)=>{
    sgMail.send({
        to: email,
        from:'s17134@st.kic.ac.jp',
        subject: 'Welcome to the app',
        text: 'hello ' + name +', First test with sengrid.'
        //html: tu peux mme  creer des html
    })
}

const sendCancellationMail = (email, name)=>{
    sgMail.send({
        to: email,
        from:'s17134@st.kic.ac.jp',
        subject: 'Cancellation notification',
        text: 'Why did you cancel your account ' + name +'?'
        //html: tu peux mme  creer des html
    })
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}