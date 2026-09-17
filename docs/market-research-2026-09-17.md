# SplitUPI launch research — 17 September 2026

Research date: 17 September 2026. This is a small, qualitative desk-research sample, not a representative survey or proof of demand. Reddit posts are self-reported anecdotes; competitor launch claims were not independently tested. Product claims below were checked against this repository's README and architecture, not real bank transfers.

## Recommended positioning

**One restaurant bill. Clear shares. Pay the merchant directly.**

Lead with the familiar moment when dinner turns into repayment administration. The specific experiment is preparing several exact UPI requests for the **same merchant**, before one friend fronts the entire bill. The interface can make each amount and recipient clear; it cannot make friends pay, guarantee a merchant accepts several payments, or verify settlement.

The strongest launch hook is: **“Dinner is over. The bill-splitting admin isn't.”** It opens on a concrete situation, then lets the product demonstration explain the workflow. This is an editorial recommendation inferred from the sources below, not a prediction of reach. No wording or posting tactic can guarantee virality.

## Five sources and what they support

| Source | Date | Observation | Implication for SplitUPI |
| --- | --- | --- | --- |
| [Reddit: asking friends to split without harming the friendship](https://www.reddit.com/r/AskIndianMen/comments/1reidkc/how_do_i_ask_my_friends_to_split_the_bill_without/) | 25 February 2026 | The author describes repeatedly paying restaurant/café bills while friends do not raise repayment. Replies discuss asking upfront and using existing splitting tools. | Lead with clarity at the table. This is evidence that one person describes this pain, not that most diners have it or that software resolves relationship problems. |
| [Reddit: Splitwise restrictions and alternatives](https://www.reddit.com/r/indiasocial/comments/1klua4y/how_are_you_all_splitting_expenses_with_friends/) | 13 May 2025; revisited 17 September 2026 | Participants complain about ads, daily entry restrictions and waiting between entries; alternatives are also suggested. | An accessible browser flow is a useful angle. These are historical user reports, not a verified statement of Splitwise's current plan limits or pricing. Do not market “the only free alternative.” |
| [Reddit: SplitPe launch and critical replies](https://www.reddit.com/r/Btechtards/comments/1whxrn6/i_built_splitpe_to_bypass_the_04_upi_surcharge/) | 16 September 2026; replies through 17 September | A developer is already promoting multi-QR/UPI bill splitting. Replies challenge the use case, repeated PIN entry and merchant payment verification. | The feature space is crowded. Merchant reconciliation and extra payment actions can erase the benefit. Treat legal, bank-limit and fee claims in comments as unverified; the operational objections are useful interview questions. |
| [Google Pay Help: Split bills on Google Pay](https://support.google.com/pay/india/answer/11420982?hl=en) | Undated official help page; checked 17 September 2026 | Google already supports group bill requests and payment status. Its documented flow sends repayments to the bill creator's primary account. | Avoid claiming that UPI splitting is new. SplitUPI's experiment is preparing requests to one merchant in a browser; Google Pay is an established alternative for reimbursing a friend. |
| [NPCI: MDR on Select UPI P2M Transactions, FAQs](https://www.npci.org.in/uploads/FA_Qs_Merchant_Discount_Rate_MDR_on_Select_UPI_P2_M_Transactions_58dba1d39e.pdf) | 15 September 2026 | Q5 gives 15 October 2026 as the effective date. Q3 describes 0.4% MDR for specified P2M transactions above ₹2,000, capped at ₹300. Q15–17 preserve free consumer/P2P use; Q23–29 describe small-merchant exemptions; Q34 prohibits passing MDR to customers; Q36 distinguishes credit-linked products. | The policy is real and scheduled, but it does **not** establish that splitting one invoice with this prototype avoids MDR. Do not promise fee savings, call MDR a tax, imply consumers need a workaround, or assert how providers classify multiple requests. |

The NPCI FAQ was reached through an official [Department of Financial Services listing](https://financialservices.gov.in/) as well as the NPCI-hosted document. A [Ministry of Finance release dated 15 September 2026](https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2310586&lang=1&reg=3) independently corroborates the consumer protections and specified-merchant framework. These two official links are provenance checks for source five.

## What the research does not establish

There is no measured willingness to pay, repeat usage, time saved or merchant acceptance in this research. Upvotes and launch comments are attention, not product adoption. Current competitors already cover both expense tracking and UPI requests, so polished design alone does not establish a durable advantage.

The key tradeoff is **less reimbursement administration for diners versus more incoming transactions for the merchant**. A useful first validation is a consenting café and a few real groups: can they agree the shares, complete payment, and let staff reconcile the bill with less effort than their normal method? Record exceptions and delays, not only completed demonstrations. A merchant insisting on one payment is valid counterevidence.

## Claims the launch assets can make

- Prepare equal, custom or fixed-amount splits; exact integer-paise calculations preserve the total.
- Generate amount-specific UPI requests and QR codes to the entered merchant VPA.
- Open the prototype in a phone browser without creating an account.
- Record manual confirmations and produce a printable local summary.
- Try a non-payable demonstration before entering real merchant details.

Avoid “bank-verified,” “guaranteed settlement,” “works with every UPI app,” “everyone stays in sync,” “automatic collection,” “zero fees,” “NPCI approved,” and “first in India.” Current sessions live in one browser's local storage. Payment completion is a user assertion, and real merchant receipt must be checked separately.

## Launch treatment

Use one visual idea per asset: an opening image showing one bill becoming clear shares; a second image showing the three-step workflow; and an animation that visibly follows bill entry → split preview → UPI request → **manually confirmed** progress. Keep the demo clearly labelled. Use the animated clip as the primary launch attachment and the stills for a later product follow-up, rather than repeating the same announcement three times.

The draft post includes `https://splitupi.webnaut.in` as requested. The domain must serve the verified build before publishing the post. Nothing was posted to LinkedIn or Reddit as part of this research.
