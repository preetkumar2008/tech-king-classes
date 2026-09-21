import Image from "next/image";

const featuredCourses = [
  { title: "Computer Fundamentals", category: "Computer Basics", level: "Beginner", badge: "FREE" },
  { title: "MS Office Complete", category: "Office Skills", level: "Beginner", badge: "FREE" },
  { title: "C Programming", category: "Programming", level: "Beginner → Advanced", badge: "FREE" },
  { title: "C++ Programming", category: "Programming", level: "Beginner → Advanced", badge: "FREE" },
  { title: "HTML & CSS", category: "Web Development", level: "Beginner", badge: "FREE" },
  { title: "Python Basics", category: "Programming", level: "Beginner", badge: "FREE" },
  { title: "AI Tools for Students", category: "Artificial Intelligence", level: "Beginner", badge: "FREE" },
  { title: "ADCA", category: "Diploma", level: "12 Months", badge: "FREE" },
];

const benefits = [
  ["01", "Learn from Basics", "Start with zero confusion and move step-by-step toward advanced topics."],
  ["02", "Practical Learning", "Learn with examples, projects, quizzes, notes and real practice."],
  ["03", "Hindi + Hinglish Friendly", "Professional English UI with easy-to-understand Hindi/Hinglish teaching."],
  ["04", "Certificates", "Complete courses and earn certificates after meeting course requirements."],
  ["05", "Progress Tracking", "Track lessons, quizzes, projects, achievements and course completion."],
  ["06", "Live Learning", "YouTube Live at launch, with private live-class options planned later."],
];

export default function Home() {
  return (
    <main>
      <header className="siteHeader">
        <div className="container navWrap">
          <a className="brand" href="#top" aria-label="Tech King Classes home">
            <Image src="/tech-king-logo.png" alt="Tech King Classes logo" width={56} height={56} className="brandLogo" priority />
            <div>
              <strong>TECH KING CLASSES</strong>
              <span>Technology for Everyone</span>
            </div>
          </a>

          <nav className="nav" aria-label="Primary navigation">
            <a href="#courses">Courses</a>
            <a href="#free-learning">Free Learning</a>
            <a href="#notes">Notes</a>
            <a href="#instructor">Instructor</a>
            <a href="#support">Support</a>
          </nav>

          <div className="navActions">
            <a className="textButton" href="#">Login</a>
            <a className="primaryButton small" href="#courses">Start Learning</a>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="container heroGrid">
          <div className="heroCopy">
            <div className="eyebrow">TECHNOLOGY FOR EVERYONE</div>
            <h1>Learn Technology.<br /><span>Build Your Future.</span></h1>
            <p>
              From computer basics to programming, AI tools and web development — learn, practice and grow with Tech King Classes.
            </p>
            <div className="heroActions">
              <a className="primaryButton" href="#courses">Explore Courses</a>
              <a className="secondaryButton" href="#free-learning">Start Learning Free</a>
            </div>
            <div className="heroHighlights" aria-label="Platform highlights">
              <div><strong>Beginner → Advanced</strong><span>Structured learning</span></div>
              <div><strong>60% Pass Mark</strong><span>Final assessment</span></div>
              <div><strong>Certificates</strong><span>On course completion</span></div>
            </div>
          </div>

          <div className="heroVisual" aria-label="Tech King mascot">
            <div className="glow glowOne" />
            <div className="glow glowTwo" />
            <div className="mascotCard">
              <Image src="/tech-king-mascot.png" alt="Tech King mascot" width={520} height={620} className="mascot" priority />
            </div>
            <div className="floatingChip chipOne">AI Tools</div>
            <div className="floatingChip chipTwo">Coding</div>
            <div className="floatingChip chipThree">Computer Basics</div>
          </div>
        </div>
      </section>

      <section className="section" id="courses">
        <div className="container">
          <div className="sectionHeading">
            <div>
              <span className="kicker">FEATURED COURSES</span>
              <h2>Start with the skills that matter.</h2>
            </div>
            <a className="viewAll" href="#">View all courses →</a>
          </div>

          <div className="courseGrid">
            {featuredCourses.map((course) => (
              <article className="courseCard" key={course.title}>
                <div className="courseTop">
                  <span className="courseCategory">{course.category}</span>
                  <span className="freeBadge">{course.badge}</span>
                </div>
                <h3>{course.title}</h3>
                <p>{course.level}</p>
                <div className="courseFooter">
                  <span>Video + Notes + Quiz</span>
                  <button aria-label={`Open ${course.title}`}>→</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section darkSection" id="free-learning">
        <div className="container">
          <div className="sectionHeading lightHeading">
            <div>
              <span className="kicker">WHY TECH KING CLASSES</span>
              <h2>Simple learning. Real progress.</h2>
            </div>
          </div>
          <div className="benefitGrid">
            {benefits.map(([num, title, text]) => (
              <article className="benefitCard" key={title}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="instructor">
        <div className="container instructorGrid">
          <div className="instructorImageWrap">
            <div className="imageFrame">
              <Image src="/preet-kumar.png" alt="Preet Kumar, Teacher at Tech King Classes" width={560} height={700} className="instructorImage" />
            </div>
          </div>
          <div className="instructorCopy">
            <span className="kicker">MEET THE INSTRUCTOR</span>
            <h2>Preet Kumar</h2>
            <h3>Teacher & Technology Educator</h3>
            <p>
              Preet Kumar teaches technology in a simple, practical and beginner-friendly way. The goal is to help students understand concepts clearly, practice them properly and move confidently from basics to advanced skills.
            </p>
            <div className="miniStats">
              <div><strong>Hindi + Hinglish</strong><span>Easy explanations</span></div>
              <div><strong>Practical First</strong><span>Learn by doing</span></div>
            </div>
            <a className="secondaryButton darkText" href="#courses">View Courses</a>
          </div>
        </div>
      </section>

      <section className="section softSection" id="notes">
        <div className="container splitCards">
          <article className="featurePanel">
            <span className="kicker">FREE NOTES</span>
            <h2>Study notes that stay organized.</h2>
            <p>Students can browse notes publicly, while downloading requires login so progress and access stay connected to the learner account.</p>
            <a className="primaryButton" href="#">Browse Free Notes</a>
          </article>
          <article className="featurePanel">
            <span className="kicker">TESTS & CERTIFICATES</span>
            <h2>Practice, pass and get certified.</h2>
            <p>Module quizzes, random question sets, a final exam and course completion tracking keep learning measurable and meaningful.</p>
            <a className="secondaryButton darkText" href="#">Explore Tests</a>
          </article>
        </div>
      </section>

      <section className="section ctaSection" id="support">
        <div className="container ctaBox">
          <div>
            <span className="kicker">START LEARNING FREE</span>
            <h2>Your technology journey can start today.</h2>
            <p>No payment required for launch courses. Create an account, start learning and track your progress.</p>
          </div>
          <div className="ctaActions">
            <a className="primaryButton" href="#courses">Start Learning</a>
            <a className="secondaryButton" href="mailto:techkingclasses@gmail.com">Email Support</a>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footerGrid">
          <div>
            <Image src="/tech-king-logo.png" alt="Tech King Classes" width={64} height={64} className="footerLogo" />
            <h3>Tech King Classes</h3>
            <p>Technology for Everyone</p>
          </div>
          <div>
            <h4>Learn</h4>
            <a href="#courses">Courses</a>
            <a href="#notes">Free Notes</a>
            <a href="#">Tests</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="tel:+919153804044">+91 91538 04044</a>
            <a href="mailto:techkingclasses@gmail.com">techkingclasses@gmail.com</a>
          </div>
          <div>
            <h4>Coming next</h4>
            <span>Student Dashboard</span>
            <span>Teacher Dashboard</span>
            <span>Certificates & Live Classes</span>
          </div>
        </div>
        <div className="container footerBottom">© 2026 Tech King Classes. All rights reserved.</div>
      </footer>
    </main>
  );
}
