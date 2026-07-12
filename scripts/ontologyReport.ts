// scripts/ontologyReport.ts
import { getStructuredOntologyRegistry } from '../lib/ranking/ontology/data';
import { validateOntology } from '../lib/ranking/ontology/builder';

function generateDetailedReport() {
  console.log("=====================================================================");
  console.log("                SOCIETAL ONTOLOGY METRIC AUDIT RUNNER                 ");
  console.log("=====================================================================");
  
  const activeRegistry = getStructuredOntologyRegistry();
  const validation = validateOntology(activeRegistry);
  
  let totalConcepts = 0;
  let totalAliases = 0;
  let totalResumeEv = 0;
  let totalJdEv = 0;

  activeRegistry.forEach(struct => {
    totalConcepts += struct.concepts.length;
    struct.concepts.forEach(c => {
      totalAliases += c.aliases.length;
      totalResumeEv += c.resumeEvidence.length;
      totalJdEv += c.jdEvidence.length;
    });
  });

  console.log(`Domains           : ${activeRegistry.length}`);
  console.log(`Concepts          : ${totalConcepts}`);
  console.log(`Total Mapped Terms: ${totalAliases + totalResumeEv + totalJdEv}`);
  console.log(`Validation Status : ${validation.valid ? 'PASSED (CI HEALTHY)' : 'FAILED'}`);
  console.log("=====================================================================");
}

generateDetailedReport();