import {
  Document,
  Image as PdfImage,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { normalizeExternalUrl } from "@/lib/resume";
import type { ResumeData } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fcfaf6",
    color: "#16313c",
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.55,
    padding: 0,
  },
  layout: {
    flexDirection: "row",
    minHeight: "100%",
  },
  sidebar: {
    width: 182,
    backgroundColor: "#eef4f2",
    paddingTop: 34,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  photo: {
    width: 112,
    height: 132,
    borderRadius: 14,
    objectFit: "cover",
    marginBottom: 18,
  },
  sidebarSection: {
    marginBottom: 18,
  },
  sidebarTitle: {
    fontSize: 9,
    color: "#4e6a73",
    textTransform: "uppercase",
    letterSpacing: 1.7,
    marginBottom: 8,
  },
  sidebarText: {
    fontSize: 9.5,
    color: "#28424c",
    marginBottom: 5,
    lineHeight: 1.45,
  },
  sidebarLink: {
    fontSize: 9,
    color: "#2f7f81",
    marginBottom: 6,
    textDecoration: "none",
  },
  skillPill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 6,
    fontSize: 8.8,
    color: "#24404a",
  },
  main: {
    flex: 1,
    paddingTop: 32,
    paddingRight: 28,
    paddingBottom: 28,
    paddingLeft: 24,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#d8ddd8",
    paddingBottom: 16,
    marginBottom: 18,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  headline: {
    marginTop: 4,
    fontSize: 12.2,
    color: "#2f7f81",
    fontWeight: 600,
  },
  summary: {
    marginTop: 10,
    fontSize: 10.3,
    color: "#35525d",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    color: "#4e6a73",
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  item: {
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 11.2,
    fontWeight: 700,
    color: "#17313d",
  },
  itemSubtitle: {
    fontSize: 9.7,
    color: "#537078",
  },
  dateText: {
    width: 100,
    flexShrink: 0,
    textAlign: "right",
    fontSize: 9,
    color: "#537078",
  },
  bullet: {
    fontSize: 9.7,
    color: "#26414b",
    marginTop: 3,
    paddingLeft: 8,
  },
  projectLink: {
    fontSize: 9,
    color: "#2f7f81",
    marginTop: 4,
    textDecoration: "none",
  },
});

function formatDateRange(startDate: string, endDate: string) {
  return [startDate, endDate].filter(Boolean).join(" - ");
}

export function ResumePdfDocument({ resumeData }: { resumeData: ResumeData }) {
  const allSkills = [
    ...resumeData.skills.core,
    ...resumeData.skills.tools,
    ...resumeData.skills.languages,
  ];
  const contactLinks = [resumeData.basics.website, resumeData.basics.linkedin, resumeData.basics.github]
    .filter(Boolean)
    .map((value) => normalizeExternalUrl(value));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.layout}>
          <View style={styles.sidebar}>
            {resumeData.basics.photoDataUrl ? (
              <PdfImage src={resumeData.basics.photoDataUrl} style={styles.photo} />
            ) : null}

            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Contact</Text>
              <Text style={styles.sidebarText}>{resumeData.basics.email || "email@example.com"}</Text>
              <Text style={styles.sidebarText}>{resumeData.basics.phone || "+1 (000) 000-0000"}</Text>
              <Text style={styles.sidebarText}>{resumeData.basics.location || "Location"}</Text>
            </View>

            {contactLinks.length > 0 ? (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Links</Text>
                {contactLinks.map((link) => (
                  <Link key={link} src={link} style={styles.sidebarLink}>
                    {link.replace(/^https?:\/\//, "")}
                  </Link>
                ))}
              </View>
            ) : null}

            {allSkills.length > 0 ? (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>Skills</Text>
                {allSkills.map((skill) => (
                  <Text key={skill} style={styles.skillPill}>
                    {skill}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.main}>
            <View style={styles.header}>
              <Text style={styles.name}>{resumeData.basics.name || "Your Name"}</Text>
              <Text style={styles.headline}>{resumeData.basics.headline || "Professional Headline"}</Text>
              <Text style={styles.summary}>
                {resumeData.basics.summary || "Professional summary pending."}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Experience</Text>
              {resumeData.experience.map((item, index) => (
                <View key={`${item.company}-${index}`} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={styles.itemTitle}>{item.role || "Role"}</Text>
                      <Text style={styles.itemSubtitle}>
                        {[item.company, item.location].filter(Boolean).join(" | ") || "Company"}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDateRange(item.startDate, item.endDate)}</Text>
                  </View>
                  {item.achievements.length > 0 ? (
                    item.achievements.map((achievement) => (
                      <Text key={achievement} style={styles.bullet}>
                        • {achievement}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.bullet}>• Key achievements can be added in the interview flow.</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {resumeData.projects.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={styles.itemTitle}>{item.name || "Project"}</Text>
                      <Text style={styles.itemSubtitle}>{item.technologies.join(", ")}</Text>
                    </View>
                  </View>
                  <Text style={styles.bullet}>• {item.description || "Project summary pending."}</Text>
                  {item.link ? (
                    <Link src={normalizeExternalUrl(item.link)} style={styles.projectLink}>
                      {normalizeExternalUrl(item.link)}
                    </Link>
                  ) : null}
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
              {resumeData.education.map((item, index) => (
                <View key={`${item.school}-${index}`} style={styles.item}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={styles.itemTitle}>{item.school || "School"}</Text>
                      <Text style={styles.itemSubtitle}>
                        {[item.degree, item.fieldOfStudy].filter(Boolean).join(" in ") || "Degree details pending."}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDateRange(item.startDate, item.endDate)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
