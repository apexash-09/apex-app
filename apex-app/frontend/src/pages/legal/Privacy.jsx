import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>
      <div style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }} className="px-5 pt-10 pb-8">
        <Link to="/" className="text-orange-100 text-sm block mb-4">← Home</Link>
        <h1 className="text-white text-2xl font-bold">Privacy Policy</h1>
        <p className="text-orange-100 text-sm mt-1">Last updated: June 2024</p>
      </div>
      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto pb-12">
        {[
          {
            title: '1. What We Collect',
            body: `We collect your mobile phone number for authentication via OTP. We may also collect your name, email address (for business owners), and location data to show you nearby salons. Booking history, payment records, and reviews you write are stored to provide our services.`
          },
          {
            title: '2. How We Use Your Data',
            body: `Your phone number is used to send OTP codes and WhatsApp notifications about your bookings. We use booking data to show your history and help businesses manage appointments. We do not sell your personal data to any third party.`
          },
          {
            title: '3. WhatsApp Notifications',
            body: `By using this app, you consent to receive WhatsApp messages for booking confirmations, reminders, and OTPs. You can opt out by contacting us, though this may limit app functionality.`
          },
          {
            title: '4. Data Sharing',
            body: `We share your name and phone number with the salon you book with so they can contact you about your appointment. Payment processing is handled by Razorpay under their privacy policy. WhatsApp messages are sent via Twilio/Meta.`
          },
          {
            title: '5. Your Rights (DPDP Act 2023)',
            body: `Under India's Digital Personal Data Protection Act 2023, you have the right to: access your personal data, correct inaccurate data, erase your data (delete your account), and withdraw consent at any time. To exercise these rights, contact us at privacy@apexapp.in`
          },
          {
            title: '6. Data Retention',
            body: `We retain your account data as long as your account is active. Booking records are kept for 2 years for legal and financial compliance. You may request deletion of your account and all associated data.`
          },
          {
            title: '7. Security',
            body: `We use HTTPS encryption for all data in transit. Passwords are hashed using bcrypt. JWT tokens expire in 15 minutes. We do not store payment card details — all payments are processed by Razorpay.`
          },
          {
            title: '8. Contact',
            body: `For privacy concerns: privacy@apexapp.in\nFor support: support@apexapp.in`
          },
        ].map(s => (
          <div key={s.title}>
            <h2 className="font-bold text-gray-900 mb-2">{s.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
