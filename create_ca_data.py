import os
import json

base_dir = "/home/pmnoushu010/Projects/studygenie/data/Direct Tax Laws/Basic Concepts"
os.makedirs(base_dir, exist_ok=True)

chapter_content = """Basic Concepts of Direct Tax Laws

1. Overview of Income Tax Law in India
The Constitution of India (Article 265) states that no tax shall be levied or collected except by authority of law. The power to levy direct taxes is given to the Central Government under Entry 82 of the Union List (Seventh Schedule to Article 246), which allows taxes on income other than agricultural income.

2. Components of Income Tax Law
- Income-tax Act: Currently, the Income-tax Act, 2025 governs the levy of income tax. It came into force on 1st April 2026.
- Annual Finance Act: Passed every year in the Parliament's Budget Session, amending the Act and specifying the rates of tax.
- Income-tax Rules: Framed by the CBDT for effective implementation.
- Circulars/Notifications: Issued by CBDT/Central Government for guidance and clarification. Circulars bind the department, not the assessee.
- Legal Decisions of Courts: Rulings by the Supreme Court and High Courts.

3. Charge of Income Tax (Section 4)
Income-tax is charged at the rates specified for the tax year by the Finance Act or the Income-tax Act on the total income of every person.

4. Important Definitions
- Assessee: A person by whom any tax or any other sum is payable under the Act.
- Person: Includes Individual, Hindu Undivided Family (HUF), Company, Firm (including LLP), Association of Persons (AOP) or Body of Individuals (BOI), Local Authority, and Artificial Juridical Person.
- Income: An inclusive definition. Includes profits, dividends, voluntary contributions, perquisites, capital gains, winnings from lotteries, gifts, etc.

5. Capital vs Revenue Receipts
- Income-tax is generally levied on revenue receipts, not capital receipts, unless specifically provided (e.g., capital gains).
- Factors to distinguish: Fixed vs. circulating capital, motive of transaction, frequency, etc.

6. Application vs Diversion of Income
- Application of income: Using income to discharge an obligation after it reaches the assessee (taxable).
- Diversion of income by overriding title: Income diverted at source before reaching the assessee under a legal or contractual obligation (not taxable for the assessee).

7. Tax Year and Assessment Year
- Tax Year: The period of 12 months commencing on 1st April. Income earned in a tax year is generally assessed in the next year.
- Exceptions (Assessed in the same year): Shipping business of non-residents, persons leaving India, AOP/BOI formed for a particular event, persons likely to transfer property to avoid tax, discontinued business.

8. Rates of Tax, Surcharge & Cess
- Default tax regime: Offers concessional tax rates subject to foregoing certain exemptions and deductions. Rates range from NIL (up to ₹4,00,000) to 30% (above ₹24,00,000).
- Optional tax regime: Higher basic exemption limits for senior citizens (₹3,00,000) and very senior citizens (₹5,00,000).
- Surcharge: Levied when income exceeds specified thresholds (e.g., 10% above ₹50 lakhs, 15% above ₹1 crore).
- Marginal Relief: Ensures the increase in tax + surcharge doesn't exceed the increase in income beyond the threshold.
- Health and Education Cess: 4% on income tax + surcharge.
- Rebate u/s 156: Available to resident individuals if total income does not exceed ₹12,00,000 (default regime) or ₹5,00,000 (optional regime).
"""

with open(os.path.join(base_dir, "chapter.txt"), "w") as f:
    f.write(chapter_content)

questions_data = {
  "summary": "This chapter introduces the fundamental concepts of Direct Tax Laws in India. It covers the constitutional validity of income tax, the various components of the income-tax law (Income-tax Act, Finance Act, Rules, Circulars, and Judicial Decisions), and the rules of interpretation used by courts. The chapter defines key terms such as 'Assessee', 'Person', and 'Income', and clearly distinguishes between revenue and capital receipts, as well as the application versus diversion of income by overriding title. It outlines the basis of charge under section 4 and specifies exceptions where income is taxed in the same tax year it is earned. Furthermore, the chapter details the tax rates, surcharge, marginal relief, and rebates applicable to different categories of persons under both the default and optional tax regimes.",
  "oneword": [
    {
      "q": "Which Article of the Constitution states that no tax shall be levied or collected except by authority of law?",
      "a": "Article 265"
    },
    {
      "q": "Who has the power to issue circulars and notifications for the administration of the Income-tax Act?",
      "a": "CBDT (Central Board of Direct Taxes)"
    },
    {
      "q": "What type of receipt is generally not taxable unless specifically included in the definition of income?",
      "a": "Capital receipt"
    },
    {
      "q": "Which concept applies when income is diverted at source before it reaches the assessee due to a legal obligation?",
      "a": "Diversion of income"
    },
    {
      "q": "What is the basic exemption limit for a resident individual aged 65 years under the optional tax regime?",
      "a": "₹ 3,00,000"
    },
    {
      "q": "At what rate is the Health and Education Cess levied on the income-tax and surcharge?",
      "a": "4%"
    }
  ],
  "sa": [
    {
      "q": "What are the components of Income-tax Law in India?",
      "a": "The components include the Income-tax Act, Annual Finance Act, Income-tax Rules, Circulars and Notifications issued by the CBDT, and Legal Decisions of Courts."
    },
    {
      "q": "What is the difference between application of income and diversion of income by overriding title?",
      "a": "Application of income happens when an assessee uses their income to discharge a self-imposed or gratuitous obligation after receiving it, which makes it taxable. Diversion of income by overriding title occurs when income is diverted at source under a legal or contractual obligation before it reaches the assessee, and such diverted income is not taxable in their hands."
    },
    {
      "q": "List the exceptions where the income of a tax year is assessed in the same tax year itself.",
      "a": "1. Shipping business of non-residents. 2. Persons leaving India. 3. AOP/BOI formed for a particular event or purpose. 4. Persons likely to transfer property to avoid tax. 5. Discontinued business."
    },
    {
      "q": "Who is considered a 'Person' under section 2(77) of the Income-tax Act?",
      "a": "A person includes an Individual, Hindu Undivided Family (HUF), Company, Firm (including LLP), Association of Persons (AOP) or Body of Individuals (BOI), Local Authority, and every Artificial Juridical Person."
    }
  ],
  "fill": [
    {
      "q": "The power to levy tax on income other than agricultural income is given to the Parliament under Entry ____ of the Union List.",
      "a": "82"
    },
    {
      "q": "Circulars issued by the CBDT are binding on the ____ but not on the assessee.",
      "a": "tax officers / department"
    },
    {
      "q": "Income tax is charged on the ____ income of the tax year of every person.",
      "a": "total"
    },
    {
      "q": "A resident individual is entitled to a rebate u/s 156 under the default tax regime if their total income does not exceed ₹ ____.",
      "a": "12,00,000"
    }
  ],
  "match": [
    {
      "q": "Article 265",
      "a": "No tax levied except by authority of law"
    },
    {
      "q": "Finance Act",
      "a": "Specifies the rates of income tax annually"
    },
    {
      "q": "Section 4",
      "a": "Charging section of Income Tax"
    },
    {
      "q": "Marginal Relief",
      "a": "Ensures tax increase does not exceed income increase"
    },
    {
      "q": "Surcharge",
      "a": "Additional tax on income tax above a threshold"
    }
  ],
  "essay": [
    {
      "q": "Discuss the 'Rules of Interpretation' used by the courts to interpret the provisions of the Income-tax Act.",
      "a": "Courts use several rules of interpretation to ascertain the intention of the lawmakers. The 'Rule of literal interpretation' stipulates that the intention must be found in the plain words of the statute. The 'Mischief rule' examines the position before the amendment to find the defect it sought to remedy. The 'Golden rule' allows departing from the normal meaning of words if a literal interpretation leads to an absurd result. The 'Rule of harmonious construction' states that all parts of a section should be read together to avoid inconsistencies. Additionally, principles like 'ejusdem generis' (general words follow specific words of the same class) and 'beneficial construction' (adopting the view most beneficial to the taxpayer in case of ambiguity) are widely used in fiscal laws."
    },
    {
      "q": "Explain the concept of Marginal Relief. Under what circumstances is it applicable?",
      "a": "Marginal Relief is a concept introduced to provide relaxation from a sudden increase in tax liability due to the levy of a surcharge when the total income marginally exceeds the specified threshold limits (e.g., ₹50 lakhs, ₹1 crore). The purpose of marginal relief is to ensure that the additional amount of income-tax payable (including surcharge) due to the increase in total income beyond the specified limit does not exceed the actual amount of increase in the total income. It is applicable to all categories of assessees (Individuals, Companies, Firms, etc.) whenever their income crosses the thresholds that trigger a new or higher rate of surcharge."
    }
  ]
}

with open(os.path.join(base_dir, "questions.json"), "w") as f:
    json.dump(questions_data, f, indent=2)

print("Created chapter.txt and questions.json successfully!")
