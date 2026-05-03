import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="min-h-screen" style={{ background: '#FDF6EE' }}>
      <div style={{ background: 'linear-gradient(135deg, #C0622F, #E8874A)' }} className="px-5 pt-10 pb-8">
        <Link to="/" className="text-orange-100 text-sm block mb-4">← Home</Link>
        <h1 className="text-white text-2xl font-bold">Terms of Service</h1>
        <p className="text-orange-100 text-sm mt-1">Last updated: June 2024</p>
      </div>
      <div className="px-5 py-6 space-y-6 max-w-2xl mx-auto pb-12">
        {[
          {
            title: '1. Platform Role',
            body: 'Apex is a marketplace platform connecting customers with local salons and parlours. We are a technology intermediary — not a service provider. The salon or business you book with is solely responsible for the quality of services rendered.'
          },
          {
            title: '2. Customer Responsibilities',
            body: 'You must provide accurate information during booking. You agree to arrive on time for appointments. Repeated no-shows may result in restrictions on your account. You are responsible for any notes or special requests you submit.'
          },
          {
            title: '3. Cancellation & Refunds',
            body: 'You may cancel a booking before the appointment time. Refund eligibility depends on the cancellation timing and the salon\'s policy. Digital payments will be refunded within 5–7 business days to the original payment method. Cash bookings are not eligible for platform refunds.'
          },
          {
            title: '4. Business Owner Responsibilities',
            body: 'Registered businesses must provide accurate information about services and prices. Businesses must honour confirmed bookings. Repeated cancellations or poor service may result in suspension from the platform. Businesses are responsible for maintaining FSSAI registration (food) or professional licences (health).'
          },
          {
            title: '5. Payments',
            body: 'Digital payments are processed by Razorpay. The platform retains an 8% commission on digital transactions. Businesses receive payouts weekly via Razorpay Route. The platform is not responsible for disputes arising from cash payments made directly to businesses.'
          },
          {
            title: '6. Account Termination',
            body: 'We reserve the right to suspend or terminate accounts that violate these terms, post fake reviews, engage in fraudulent activity, or abuse the platform in any way.'
          },
          {
            title: '7. Limitation of Liability',
            body: 'The platform is not liable for the quality of services provided by businesses. We are not responsible for disputes between customers and service providers. Our maximum liability is limited to the transaction value of the disputed booking.'
          },
          {
            title: '8. Governing Law',
            body: 'These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Bengaluru, Karnataka.'
          },
          {
            title: '9. Contact',
            body: 'For queries about these terms: legal@apexapp.in'
          },
        ].map(s => (
          <div key={s.title}>
            <h2 className="font-bold text-gray-900 mb-2">{s.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
