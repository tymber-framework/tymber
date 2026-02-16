import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Batteries-included',
    Svg: require('@site/static/img/mdi-battery-high.svg').default,
    description: (
      <>
        Built-in dependency injection, database migrations, internationalization and SQL query builder.
      </>
    ),
  },
  {
    title: 'Secure by default',
    Svg: require('@site/static/img/mdi-security.svg').default,
    description: (
      <>
        Built-in security like Cross-Origin Resource Sharing (CORS) and Cross-Site Request Forgery (CSRF) protection.
      </>
    ),
  },
  {
    title: 'Modular and extensible',
    Svg: require('@site/static/img/mdi-graph-outline.svg').default,
    description: (
      <>
        Properly organized code, easy to extend and customize.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
