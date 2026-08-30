use std::fs;
use std::io::Write;
use std::path::PathBuf;
use tempfile::tempdir;
use zip::write::FileOptions;

/// Crea un .zip real de prueba en `dir` con el contenido dado.
fn make_test_zip(dir: &std::path::Path, name: &str, file_content: &str) -> PathBuf {
    let zip_path = dir.join(name);
    let file = fs::File::create(&zip_path).unwrap();
    let mut writer = zip::ZipWriter::new(file);
    writer
        .start_file("contenido.txt", FileOptions::default())
        .unwrap();
    writer.write_all(file_content.as_bytes()).unwrap();
    writer.finish().unwrap();
    zip_path
}

#[test]
fn extrae_un_solo_zip() {
    let dir = tempdir().unwrap();
    let zip_path = make_test_zip(dir.path(), "prueba1.zip", "hola desde zip 1");

    let dest = dir.path().join("prueba1");
    archive_tools::extract_one(&zip_path, &dest).expect("debería extraer sin error");

    let extraido = fs::read_to_string(dest.join("contenido.txt")).unwrap();
    assert_eq!(extraido, "hola desde zip 1");
}

#[test]
fn batch_extract_procesa_varios_archivos_independientes() {
    let dir = tempdir().unwrap();

    // Simula el escenario real: varios zips mezclados, cada uno con
    // contenido distinto, como tus "zip2", "zip3" del ejemplo.
    let zip1 = make_test_zip(dir.path(), "zip1.zip", "contenido A");
    let zip2 = make_test_zip(dir.path(), "zip2.zip", "contenido B");
    let zip3 = make_test_zip(dir.path(), "zip3.zip", "contenido C");

    let outcomes = archive_tools::batch_extract(&[zip1, zip2, zip3]);

    assert_eq!(outcomes.len(), 3);
    for outcome in &outcomes {
        assert!(
            outcome.result.is_ok(),
            "{:?} falló: {:?}",
            outcome.archive,
            outcome.result
        );
        assert!(outcome.dest.join("contenido.txt").exists());
    }

    // Verifica que cada carpeta tiene SU contenido, no mezclado
    let c1 = fs::read_to_string(dir.path().join("zip1/contenido.txt")).unwrap();
    let c2 = fs::read_to_string(dir.path().join("zip2/contenido.txt")).unwrap();
    let c3 = fs::read_to_string(dir.path().join("zip3/contenido.txt")).unwrap();
    assert_eq!(c1, "contenido A");
    assert_eq!(c2, "contenido B");
    assert_eq!(c3, "contenido C");
}

#[test]
fn batch_extract_sigue_aunque_uno_falle() {
    let dir = tempdir().unwrap();

    let zip_bueno = make_test_zip(dir.path(), "bueno.zip", "esto sí funciona");

    // Un archivo que NO es un zip válido, para simular corrupción
    let zip_malo = dir.path().join("malo.zip");
    fs::write(&zip_malo, b"esto no es un zip de verdad").unwrap();

    let outcomes = archive_tools::batch_extract(&[zip_bueno, zip_malo]);

    assert_eq!(outcomes.len(), 2);
    assert!(outcomes[0].result.is_ok(), "el zip bueno debería funcionar");
    assert!(outcomes[1].result.is_err(), "el zip malo debería fallar");
}

#[test]
fn formato_desconocido_da_error_claro() {
    let dir = tempdir().unwrap();
    let archivo_raro = dir.path().join("cosa.7z");
    fs::write(&archivo_raro, b"lo que sea").unwrap();

    let result = archive_tools::extract_one(&archivo_raro, &dir.path().join("out"));
    assert!(matches!(result, Err(archive_tools::ArchiveError::UnknownFormat(_))));
}
