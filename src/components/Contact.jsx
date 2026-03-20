import React, { useState } from 'react';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Thank you for contacting us! We will get back to you shortly.');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="contact-content">
            <div className="flex gap-8 items-start mb-8 flex-col lg:flex-row">
                <div className="glass-panel flex-1">
                    <h1>Get in Touch</h1>
                    <p className="text-secondary">Have questions or want to learn more about how Eventify can transform your college experience? Fill out the form and our team will get back to you.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" className="form-control" placeholder="Your Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" className="form-control" placeholder="Your College Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea className="form-control" rows="4" placeholder="How can we help?" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required />
                        </div>
                        <button className="btn btn-primary" type="submit">Send Message</button>
                    </form>
                </div>

                <div className="glass-panel flex-1" style={{ maxWidth: '400px' }}>
                    <h3>Contact Details</h3>
                    <p><strong>Support Email:</strong> support@eventify.edu</p>
                    <p><strong>Admin Office:</strong> Tech Hub, Level 2</p>
                    <p><strong>Follow Us:</strong> @EventifyCollege</p>
                    <hr className="my-4 border-t border-gray-200" />
                    <h3 className="mt-4">Our Commitment</h3>
                    <p className="text-secondary">We aim to respond to all inquiries within 24 hours during academic terms.</p>
                </div>
            </div>
        </div>
    );
};

export default Contact;
