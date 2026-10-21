// src/components/ui/TermsAndConditionsModal.tsx
import React from "react";
import { X, ShieldCheck, Check } from "lucide-react";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  alreadyAgreed: boolean;
}

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
  alreadyAgreed,
}: TermsAndConditionsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="flex h-[90vh] max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <ShieldCheck className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 id="terms-title" className="text-lg font-bold text-gray-900">
                Terms and Conditions
              </h2>
              <p className="text-xs text-gray-500">
                Version 1.0 · Effective 20 October 2026
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm leading-relaxed text-gray-700">
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700">
            <h1 className="mb-2 text-2xl font-extrabold text-gray-900">
              ELILITA
            </h1>
            <p className="mb-6 text-base font-semibold text-gray-700">
              Rules for using the Elilita application and marketplace
            </p>
            <p className="mb-4">
              These Terms and Conditions govern access to and use of the Elilita
              app, website, marketplace, delivery features, service-booking
              features, and related services (collectively, the "Platform"). By
              creating an account, browsing where an account is not required,
              placing an order, booking a service, or otherwise using a feature
              that presents these Terms, you agree to the provisions that apply
              to that use.
            </p>
            <p className="mb-6 font-medium">
              Please read these Terms carefully. If you do not agree, do not
              create an account or use the relevant Platform services.
            </p>

            <Section title="1. Who We Are and What the Platform Does">
              <p>
                Elilita is a digital platform that helps customers discover
                products and services offered by participating vendors and
                service providers and, where available, arrange orders,
                bookings, payments, delivery, and related support.
              </p>
              <p>
                References to "Elilita", "we", "us", or "our" mean the operator
                of the Elilita Platform. "You" or "user" means any person who
                accesses or uses the Platform. "Vendor" means a seller,
                merchant, restaurant, shop, or other business listing goods.
                "Service Provider" means a person or business offering a
                service through the Platform.
              </p>
              <p>
                Unless a listing or checkout page expressly states otherwise,
                vendors and service providers are independent businesses, not
                employees or agents of Elilita. A sale or service may be
                supplied by the relevant vendor or provider, while Elilita
                provides the digital tools that facilitate discovery, ordering,
                booking, payment processing, delivery coordination, or support.
              </p>
            </Section>

            <Section title="2. Acceptance and Electronic Records">
              <p>
                By selecting an acceptance control, creating an account, or
                continuing with a transaction after these Terms are presented,
                you confirm that you have read and agree to these Terms and any
                additional terms clearly presented for the relevant feature.
              </p>
              <p>
                Where the Platform records acceptance, we may retain the account
                identifier, accepted document version, date and time, and
                related technical records as evidence of the transaction and
                acceptance. You should keep a copy of these Terms for your
                records.
              </p>
              <p>
                If you use the Platform on behalf of a business or another
                person, you confirm that you are authorised to bind that person
                or business to the applicable terms.
              </p>
            </Section>

            <Section title="3. Eligibility and Accounts">
              <p>
                You must provide accurate, current, and complete information
                when registering or placing an order. You must update
                information that becomes inaccurate and must not impersonate
                another person, use another person's account without permission,
                or create an account for an unlawful purpose.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your
                login credentials and for activity carried out through your
                account, except to the extent caused by our own failure to apply
                reasonable security measures or otherwise required by applicable
                law. Notify us promptly if you suspect unauthorised access.
              </p>
              <p>
                We may request information reasonably necessary to verify an
                account, vendor, service provider, delivery partner, or
                payment-related activity. Verification may include review of
                identity or business documents, contact details, licences, or
                other information appropriate to the role and permitted by law.
              </p>
              <p>
                We may restrict, suspend, or close an account where we
                reasonably believe there is fraud, a security risk, a breach of
                these Terms, unlawful conduct, repeated abuse, or a legal
                requirement. Where reasonably practicable and lawful, we will
                provide notice and an opportunity to resolve the issue.
              </p>
            </Section>

            <Section title="4. Vendors, Listings, and Product Information">
              <p>
                Vendors are responsible for the legality, safety, quality,
                availability, description, pricing, stock status, packaging, and
                fulfilment of their listed products, subject to responsibilities
                imposed on Elilita by applicable law.
              </p>
              <p>
                Product images and descriptions are intended to help you make an
                informed choice. Actual appearance, packaging, size, colour, or
                availability may vary. You should review the listing and any
                required product information before ordering.
              </p>
              <p>
                Elilita may review, verify, rank, hide, reject, or remove
                listings and may request supporting documents. A verification
                badge or review indicates only the checks described by the
                Platform; it is not an unlimited guarantee of a vendor, product,
                or transaction.
              </p>
              <p>
                Vendors must keep listings accurate, honour confirmed orders
                unless a lawful reason prevents fulfilment, comply with
                applicable licensing and consumer-protection requirements, and
                not list counterfeit, prohibited, unsafe, stolen, or otherwise
                unlawful goods.
              </p>
            </Section>

            <Section title="5. Orders, Prices, and Order Confirmation">
              <p>
                An order request is an offer to purchase the listed goods or
                services on the terms shown at checkout. The order is accepted
                when the Platform or vendor confirms it, as indicated in the
                app. A cart, pending payment, or order request alone does not
                guarantee acceptance or availability.
              </p>
              <p>
                Prices, delivery charges, service charges, discounts, taxes, and
                other applicable fees will be shown or explained before you
                confirm the transaction, to the extent required and supported by
                the relevant checkout flow. The final amount payable is the
                amount shown in the confirmed checkout or order record.
              </p>
              <p>
                If a listing contains a material error, an item is unavailable,
                a payment is not authorised, or fulfilment is not reasonably
                possible, the order may be declined or cancelled. If you have
                paid, any refund due will be handled under Section 7 and
                applicable law.
              </p>
              <p>
                Promotional codes and discounts may have conditions, expiry
                dates, eligibility requirements, or limits. They cannot be used
                fraudulently, exchanged for cash unless stated, or combined
                unless the offer allows it.
              </p>
            </Section>

            <Section title="6. Changes and Cancellations">
              <p>
                You may request cancellation through the available order
                controls or customer support. Whether cancellation is available
                depends on the order status, the nature of the goods or service,
                vendor preparation or dispatch, and applicable law. The Platform
                will display the available options where supported.
              </p>
              <p>
                A vendor or service provider may cancel an order or booking if
                the item or service is unavailable, a material listing error
                occurred, payment cannot be completed, safety or legal concerns
                arise, or another valid reason prevents fulfilment. We will
                communicate the cancellation through the Platform where
                practicable.
              </p>
              <p>
                Nothing in these Terms removes a cancellation, return, repair,
                replacement, refund, or other right that cannot lawfully be
                excluded.
              </p>
            </Section>

            <Section title="7. Payments, Refunds, and Payouts">
              <p>
                The Platform may support payment methods displayed at checkout,
                which may include online payment providers, bank transfer, cash
                on delivery, or other locally available methods. The methods
                available may change by transaction, location, vendor, or
                technical availability.
              </p>
              <p>
                You authorise the selected payment provider or relevant payment
                channel to process the amount you approve. Payment credentials
                may be handled by the payment provider under its own terms and
                privacy notice. Elilita does not promise that every payment
                method will be available at all times.
              </p>
              <p>
                An order may remain pending while payment or confirmation is
                checked. Do not submit repeated payments for the same order if
                the status is unclear; first check the order record or contact
                support.
              </p>
              <p>
                Refund eligibility depends on the reason for the request, order
                status, product or service type, payment method, vendor
                response, and applicable law. Approved refunds will normally be
                returned through the original payment method where feasible, or
                by another method communicated to you. Processing times may
                depend on the bank or payment provider.
              </p>
              <p>
                Vendors and service providers are responsible for the accuracy
                of their payout details and for applicable taxes, fees, and
                business obligations. Elilita may hold or delay a payout where
                needed to investigate a dispute, suspected fraud, chargeback,
                incorrect details, or legal requirement, and will handle the
                matter in accordance with applicable law and the relevant vendor
                agreement.
              </p>
            </Section>

            <Section title="8. Delivery, Addresses, and Tracking">
              <p>
                You are responsible for providing a complete and accurate
                delivery address, phone number, and delivery instructions. You
                should make yourself available at the agreed delivery location
                and promptly respond to reasonable delivery communications.
              </p>
              <p>
                Delivery estimates are estimates, not guarantees, unless
                expressly stated as guaranteed. Delays may result from traffic,
                weather, safety conditions, vendor preparation, inaccurate
                address details, payment confirmation, or events beyond
                reasonable control.
              </p>
              <p>
                Where the Platform provides driver assignment, route display,
                live location, or delivery-status updates, these features are
                intended to support coordination and may be delayed,
                approximate, temporarily unavailable, or dependent on device
                connectivity and location permissions.
              </p>
              <p>
                If delivery cannot be completed because the address is
                incorrect, no authorised recipient is available, or reasonable
                delivery attempts fail, additional delivery arrangements or
                charges may apply if disclosed and lawful.
              </p>
            </Section>

            <Section title="9. Service Bookings">
              <p>
                Service descriptions, availability, schedules, prices,
                qualifications, and cancellation conditions should be reviewed
                before confirming a booking. A booking is confirmed only when
                the Platform or service provider indicates confirmation.
              </p>
              <p>
                You must provide accurate booking details and comply with
                reasonable preparation, access, safety, and cancellation
                instructions. Service providers are responsible for performing
                their services lawfully and with the care and skill required by
                applicable law.
              </p>
              <p>
                If a service provider cancels or fails to attend, or if you
                believe a service was not provided as agreed, contact support
                promptly and provide the booking reference and relevant details.
                Remedies will depend on the facts, the displayed booking terms,
                and applicable law.
              </p>
            </Section>

            <Section title="10. Delivery Partners and Location Information">
              <p>
                If you enable location permissions, the Platform may use device
                location to support address selection, delivery assignment,
                navigation, or live tracking. You can manage location
                permissions through your device settings, although disabling
                them may limit certain features.
              </p>
              <p>
                Delivery partners must use customer information and location
                data only for legitimate delivery or support purposes, keep
                account credentials secure, follow safety instructions, and not
                misuse, disclose, or retain customer data beyond what is
                permitted.
              </p>
              <p>
                Map routes, estimated distances, and location markers are
                informational tools and may not reflect real-time road
                conditions or exact positions.
              </p>
            </Section>

            <Section title="11. Subscriptions, Advertising, and Promotions">
              <p>
                If the Platform offers paid subscriptions or vendor plans, the
                applicable price, billing period, included features, renewal
                rules, and cancellation method will be shown before purchase. A
                subscription begins when the Platform confirms activation and
                payment, where payment is required.
              </p>
              <p>
                Unless the checkout states otherwise, cancelling a subscription
                stops future renewal but does not automatically refund a period
                already paid for. Any refund rights required by law or expressly
                offered for the plan remain available.
              </p>
              <p>
                Advertising placements and promotional offers may be subject to
                eligibility, duration, content, and payment conditions.
                Advertisers and vendors are responsible for ensuring that
                submitted advertising is lawful, accurate, and properly
                authorised.
              </p>
              <p>
                Elilita may pause or remove an advertisement or promotion that
                breaches these Terms, applicable law, or Platform rules.
              </p>
            </Section>

            <Section title="12. Acceptable Use">
              <p>
                You must not use the Platform to break the law, deceive users,
                commit fraud, threaten or harass others, infringe intellectual
                property, distribute malware, interfere with Platform security,
                manipulate ratings or orders, evade fees, or submit false
                identity or business information.
              </p>
              <p>
                You must not access accounts, data, systems, or administrative
                functions without authorisation; scrape or copy Platform content
                at scale without permission; reverse engineer the Platform
                except where such restriction is prohibited by law; or
                interfere with normal Platform operation.
              </p>
              <p>
                We may investigate suspected misuse, preserve relevant records
                where lawful, remove content, reverse or restrict transactions
                where justified, and report suspected unlawful activity to
                competent authorities where required or appropriate.
              </p>
            </Section>

            <Section title="13. Reviews, Messages, and User Content">
              <p>
                You are responsible for content you submit, including reviews,
                photos, messages, product listings, and support evidence.
                Content must be truthful to the best of your knowledge,
                relevant, lawful, and respectful of others' rights.
              </p>
              <p>
                You retain ownership of content you own. You grant Elilita a
                non-exclusive, worldwide, royalty-free licence to host, store,
                reproduce, display, and use that content as reasonably necessary
                to operate, promote, secure, and improve the Platform, subject
                to your rights under applicable law and our Privacy Notice.
              </p>
              <p>
                We may moderate, hide, or remove content that appears unlawful,
                misleading, abusive, unsafe, or inconsistent with these Terms.
                We do not guarantee that all user content has been independently
                verified.
              </p>
            </Section>

            <Section title="14. Complaints, Disputes, Returns, and Support">
              <p>
                If there is a problem with an order, delivery, booking, payment,
                vendor, or service provider, contact Elilita support and include
                the order or booking reference, a clear description of the
                issue, and relevant evidence such as photos or payment
                confirmation where appropriate.
              </p>
              <p>
                We may ask the parties for information, review order and
                delivery records, coordinate communication, and determine
                Platform-side actions such as order-status updates, account
                restrictions, or processing a refund where authorised. Our
                internal review does not prevent a user from exercising rights
                before a competent authority or court.
              </p>
              <p>
                Users and vendors must cooperate honestly with dispute reviews
                and must not submit fabricated evidence or use the dispute
                process to harass or defraud another party.
              </p>
            </Section>

            <Section title="15. Privacy and Personal Information">
              <p>
                We collect and use personal information as needed to create and
                secure accounts, process orders and bookings, coordinate
                delivery, process payments, provide support, prevent fraud, meet
                legal obligations, and improve the Platform.
              </p>
              <p>
                Information may include contact and account details, order and
                booking history, transaction references, support communications,
                device or technical information, and location information where
                you enable location-based features. We share information with
                relevant vendors, service providers, delivery partners, payment
                providers, hosting or technology providers, and authorities
                where needed for the purposes described above or where lawfully
                required.
              </p>
              <p>
                We apply reasonable measures designed to protect personal
                information and limit access to people and service providers who
                need it for legitimate purposes. No digital system can be
                guaranteed completely secure.
              </p>
              <p>
                Requests concerning access, correction, deletion, objection, or
                other privacy rights may be submitted through the support
                contact below. We will respond in accordance with applicable
                law. Further details may be provided in a separate Elilita
                Privacy Notice; if one is published, read it together with these
                Terms.
              </p>
            </Section>

            <Section title="16. Intellectual Property">
              <p>
                The Platform, including its software, interface, branding,
                logos, layout, and original materials, is owned by or licensed
                to Elilita and protected by applicable intellectual-property
                laws. Except as permitted by law or expressly authorised, you
                may not copy, modify, distribute, sell, or create derivative
                works from those materials.
              </p>
              <p>
                You may use the Platform for its intended personal or authorised
                business purposes while complying with these Terms. Use of
                Elilita branding or other intellectual property requires prior
                permission unless otherwise permitted by law.
              </p>
            </Section>

            <Section title="17. Availability, Changes, and Suspension">
              <p>
                We aim to keep the Platform available and accurate, but do not
                guarantee uninterrupted or error-free operation. Maintenance,
                updates, network failures, third-party outages, security
                incidents, or other events may temporarily affect features.
              </p>
              <p>
                We may update, add, or discontinue features, payment methods,
                delivery options, or Platform rules. Where a change materially
                affects users or their rights, we will provide notice where
                required by law. Changes to these Terms will be published with
                an updated effective date, and renewed acceptance will be
                requested when required.
              </p>
              <p>
                We may suspend access to protect users, investigate abuse,
                comply with law, or maintain Platform security. Where lawful and
                reasonably practicable, we will explain the reason and the steps
                available to address the issue.
              </p>
            </Section>

            <Section title="18. Disclaimers and Liability">
              <p>
                To the extent permitted by applicable law, the Platform is
                provided on an "as available" basis. We do not warrant that
                every listing, vendor, service provider, delivery estimate, map
                result, or third-party payment service will always be available,
                accurate, or uninterrupted.
              </p>
              <p>
                Elilita is responsible for its own obligations under applicable
                law and these Terms. To the extent permitted by law, Elilita is
                not responsible for a vendor's independent product
                representations, a service provider's independent performance,
                or a third party's systems, except where responsibility cannot
                lawfully be excluded or where Elilita's own acts or omissions
                give rise to liability.
              </p>
              <p>
                Nothing in these Terms excludes or limits liability, remedies,
                guarantees, or consumer rights that cannot lawfully be excluded
                or limited. Where the law permits a limitation, liability will
                be assessed in light of the nature of the claim, the loss, and
                the circumstances.
              </p>
            </Section>

            <Section title="19. Indemnity">
              <p>
                To the extent permitted by applicable law, you are responsible
                for losses and reasonable costs directly caused by your fraud,
                unlawful conduct, infringement of another person's rights, or
                material breach of these Terms. This clause does not make you
                responsible for losses caused by Elilita's own breach,
                negligence, or unlawful conduct, and does not limit rights that
                cannot lawfully be waived.
              </p>
            </Section>

            <Section title="20. Events Beyond Reasonable Control">
              <p>
                We are not responsible for delay or failure caused by
                circumstances beyond our reasonable control, such as natural
                disasters, public emergencies, network or utility failures,
                transport disruption, labour disruption, or government action.
                We will take reasonable steps to reduce the impact and restore
                affected services where practicable.
              </p>
            </Section>

            <Section title="21. Governing Law and Disputes">
              <p>
                These Terms are governed by the laws of the Federal Democratic
                Republic of Ethiopia, except where mandatory law provides
                otherwise. The parties will first try to resolve concerns
                through Elilita support in good faith.
              </p>
              <p>
                If a dispute cannot be resolved informally, it may be referred
                to a competent Ethiopian court or other competent
                dispute-resolution body as provided by applicable law. Nothing
                in this section prevents a consumer from using a mandatory
                complaint, regulatory, or legal process available under law.
              </p>
            </Section>

            <Section title="22. Changes to These Terms">
              <p>
                We may revise these Terms to reflect changes in the Platform,
                business operations, security requirements, or applicable law.
                The current version will be made available through the Platform
                and will show its effective date.
              </p>
              <p>
                Material changes will apply prospectively from the stated
                effective date, subject to applicable law. Where renewed consent
                is legally required or the Platform requires it for a material
                feature, we will present the updated Terms and record acceptance
                before the user continues with that feature.
              </p>
            </Section>

            <Section title="23. Contact and Notices">
              <p>
                For questions, complaints, or requests relating to these Terms,
                contact Elilita support:
              </p>
              <p className="font-medium">
                Email: support@elilitapp.com
                <br />
                Phone: +251 909 527 600
              </p>
              <p>
                Please verify that these contact details remain active before
                publishing this document. Notices may also be delivered through
                in-app messages, email, SMS, or other contact details associated
                with your account where appropriate and lawful.
              </p>
            </Section>

            <Section title="24. General Provisions">
              <p>
                If any provision is held invalid or unenforceable, the remaining
                provisions continue to apply to the extent permitted by law.
                Failure to enforce a provision is not a waiver of the right to
                enforce it later.
              </p>
              <p>
                You may not transfer your rights or obligations under these
                Terms without our prior consent, except where applicable law
                permits otherwise. Elilita may transfer its rights and
                obligations as part of a lawful restructuring, merger, or
                transfer of the relevant service, subject to applicable law.
              </p>
              <p>
                These Terms, together with any additional terms clearly
                presented for a particular feature and any applicable Privacy
                Notice, form the agreement governing your use of the relevant
                Platform services. If a translated version conflicts with the
                English version, the version designated by the Platform as
                controlling will apply to the extent permitted by law.
              </p>
            </Section>

            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Elilita Terms and Conditions Version 1.0
              </p>
              <p className="text-sm font-bold text-gray-900">
                Effective 20 October 2026
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            {alreadyAgreed ? (
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <Check className="h-4 w-4" /> You have already agreed
              </span>
            ) : (
              <span>Please review the merchant terms before accepting</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="rounded-xl bg-secondary px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5b4694]"
            >
              {alreadyAgreed ? "Close (Accepted)" : "I Agree & Accept"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small helper for rendering section titles consistently */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}